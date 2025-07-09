# PostgreSQL 데이터베이스 백업 및 복구 전략

## 1. 백업 전략

### 1.1 자동 백업 스케줄

```bash
# 매일 새벽 2시 전체 백업
0 2 * * * /usr/bin/pg_dump -h localhost -U postgres -d inflnara > /backup/daily/inflnara_$(date +\%Y\%m\%d).sql

# 매주 일요일 새벽 3시 전체 백업 (보관용)
0 3 * * 0 /usr/bin/pg_dump -h localhost -U postgres -d inflnara > /backup/weekly/inflnara_$(date +\%Y\%m\%d).sql

# 매월 1일 새벽 4시 전체 백업 (장기 보관용)
0 4 1 * * /usr/bin/pg_dump -h localhost -U postgres -d inflnara > /backup/monthly/inflnara_$(date +\%Y\%m\%d).sql
```

### 1.2 백업 스크립트

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/backup"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="inflnara"
DB_USER="postgres"
DB_HOST="localhost"

# 백업 디렉토리 생성
mkdir -p $BACKUP_DIR/daily
mkdir -p $BACKUP_DIR/weekly
mkdir -p $BACKUP_DIR/monthly

# 전체 백업
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME > $BACKUP_DIR/daily/inflnara_$DATE.sql

# 압축
gzip $BACKUP_DIR/daily/inflnara_$DATE.sql

# 30일 이상 된 일일 백업 삭제
find $BACKUP_DIR/daily -name "*.sql.gz" -mtime +30 -delete

# 12주 이상 된 주간 백업 삭제
find $BACKUP_DIR/weekly -name "*.sql.gz" -mtime +84 -delete

# 12개월 이상 된 월간 백업 삭제
find $BACKUP_DIR/monthly -name "*.sql.gz" -mtime +365 -delete
```

### 1.3 WAL (Write-Ahead Logging) 백업

```bash
# postgresql.conf 설정
wal_level = replica
archive_mode = on
archive_command = 'test ! -f /backup/wal/%f && cp %p /backup/wal/%f'
```

## 2. 복구 전략

### 2.1 전체 복구

```bash
#!/bin/bash
# restore.sh

BACKUP_FILE=$1
DB_NAME="inflnara"
DB_USER="postgres"
DB_HOST="localhost"

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <backup_file>"
    exit 1
fi

# 데이터베이스 중지
sudo systemctl stop postgresql

# 기존 데이터베이스 삭제
dropdb -h $DB_HOST -U $DB_USER $DB_NAME

# 새 데이터베이스 생성
createdb -h $DB_HOST -U $DB_USER $DB_NAME

# 백업에서 복구
if [[ $BACKUP_FILE == *.gz ]]; then
    gunzip -c $BACKUP_FILE | psql -h $DB_HOST -U $DB_USER -d $DB_NAME
else
    psql -h $DB_HOST -U $DB_USER -d $DB_NAME < $BACKUP_FILE
fi

# 데이터베이스 시작
sudo systemctl start postgresql
```

### 2.2 Point-in-Time 복구

```bash
#!/bin/bash
# pitr_restore.sh

BACKUP_FILE=$1
RECOVERY_TIME=$2
DB_NAME="inflnara"
DB_USER="postgres"
DB_HOST="localhost"

# 복구 설정 파일 생성
cat > recovery.conf << EOF
restore_command = 'cp /backup/wal/%f %p'
recovery_target_time = '$RECOVERY_TIME'
EOF

# 백업에서 복구
gunzip -c $BACKUP_FILE | psql -h $DB_HOST -U $DB_USER -d $DB_NAME

# WAL 파일 복사
cp recovery.conf /var/lib/postgresql/data/

# PostgreSQL 재시작
sudo systemctl restart postgresql
```

## 3. 모니터링 및 알림

### 3.1 백업 상태 확인 스크립트

```bash
#!/bin/bash
# check_backup.sh

BACKUP_DIR="/backup"
ALERT_EMAIL="admin@inflnara.com"

# 최신 백업 파일 확인
LATEST_BACKUP=$(find $BACKUP_DIR/daily -name "*.sql.gz" -type f -printf '%T@ %p\n' | sort -n | tail -1 | cut -f2- -d" ")

if [ -z "$LATEST_BACKUP" ]; then
    echo "백업 파일을 찾을 수 없습니다!" | mail -s "백업 실패 알림" $ALERT_EMAIL
    exit 1
fi

# 백업 파일 크기 확인
BACKUP_SIZE=$(stat -c%s "$LATEST_BACKUP")
MIN_SIZE=1000000  # 1MB

if [ $BACKUP_SIZE -lt $MIN_SIZE ]; then
    echo "백업 파일이 너무 작습니다: $BACKUP_SIZE bytes" | mail -s "백업 크기 이상 알림" $ALERT_EMAIL
    exit 1
fi

# 백업 파일 무결성 확인
gunzip -t "$LATEST_BACKUP"
if [ $? -ne 0 ]; then
    echo "백업 파일이 손상되었습니다: $LATEST_BACKUP" | mail -s "백업 무결성 실패" $ALERT_EMAIL
    exit 1
fi

echo "백업 상태 정상: $LATEST_BACKUP"
```

### 3.2 백업 통계 수집

```sql
-- 백업 통계 뷰 생성
CREATE VIEW backup_stats AS
SELECT 
    DATE_TRUNC('day', backup_time) as backup_date,
    COUNT(*) as backup_count,
    AVG(backup_size_mb) as avg_size_mb,
    MAX(backup_size_mb) as max_size_mb,
    MIN(backup_size_mb) as min_size_mb
FROM backup_log
GROUP BY DATE_TRUNC('day', backup_time)
ORDER BY backup_date DESC;
```

## 4. 고가용성 전략

### 4.1 Master-Slave 복제 설정

```bash
# Master 설정 (postgresql.conf)
wal_level = replica
max_wal_senders = 3
wal_keep_segments = 64

# Slave 설정 (recovery.conf)
standby_mode = 'on'
primary_conninfo = 'host=master_host port=5432 user=repl password=repl_password'
trigger_file = '/tmp/promote_standby'
```

### 4.2 자동 페일오버 스크립트

```bash
#!/bin/bash
# failover.sh

MASTER_HOST="master.inflnara.com"
SLAVE_HOST="slave.inflnara.com"
HEALTH_CHECK_INTERVAL=30

while true; do
    # Master 상태 확인
    if ! pg_isready -h $MASTER_HOST -p 5432; then
        echo "Master 서버가 다운되었습니다. 페일오버를 시작합니다."
        
        # Slave를 Master로 승격
        ssh $SLAVE_HOST "sudo -u postgres touch /tmp/promote_standby"
        
        # DNS 업데이트 (Route53 등)
        aws route53 change-resource-record-sets \
            --hosted-zone-id Z1234567890 \
            --change-batch '{
                "Changes": [{
                    "Action": "UPSERT",
                    "ResourceRecordSet": {
                        "Name": "db.inflnara.com",
                        "Type": "CNAME",
                        "TTL": 300,
                        "ResourceRecords": [{"Value": "'$SLAVE_HOST'"}]
                    }
                }]
            }'
        
        echo "페일오버가 완료되었습니다."
        break
    fi
    
    sleep $HEALTH_CHECK_INTERVAL
done
```

## 5. 백업 테스트 및 검증

### 5.1 백업 복구 테스트

```bash
#!/bin/bash
# test_restore.sh

# 테스트 환경에서 백업 복구 테스트
TEST_DB="inflnara_test"
BACKUP_FILE="/backup/daily/inflnara_20231201.sql.gz"

# 테스트 데이터베이스 생성
createdb -U postgres $TEST_DB

# 백업에서 복구
gunzip -c $BACKUP_FILE | psql -U postgres -d $TEST_DB

# 데이터 무결성 검사
psql -U postgres -d $TEST_DB -c "
SELECT 
    schemaname,
    tablename,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes
FROM pg_stat_user_tables
ORDER BY schemaname, tablename;
"

# 테스트 데이터베이스 삭제
dropdb -U postgres $TEST_DB
```

## 6. 보안 고려사항

### 6.1 백업 파일 암호화

```bash
# 백업 파일 암호화
gpg --encrypt --recipient admin@inflnara.com /backup/daily/inflnara_20231201.sql

# 암호화된 백업 복호화
gpg --decrypt /backup/daily/inflnara_20231201.sql.gpg > /backup/daily/inflnara_20231201.sql
```

### 6.2 백업 파일 접근 제어

```bash
# 백업 디렉토리 권한 설정
chmod 750 /backup
chown postgres:postgres /backup

# 백업 파일 권한 설정
find /backup -name "*.sql.gz" -exec chmod 600 {} \;
find /backup -name "*.sql.gz" -exec chown postgres:postgres {} \;
```

## 7. 문서화 및 로깅

### 7.1 백업 로그 테이블

```sql
CREATE TABLE backup_log (
    id SERIAL PRIMARY KEY,
    backup_type VARCHAR(20) NOT NULL,
    backup_file VARCHAR(255) NOT NULL,
    backup_size_mb DECIMAL(10,2),
    backup_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    duration_seconds INTEGER,
    status VARCHAR(20) DEFAULT 'success',
    error_message TEXT
);

-- 백업 로그 인덱스
CREATE INDEX idx_backup_log_time ON backup_log(backup_time);
CREATE INDEX idx_backup_log_status ON backup_log(status);
```

이 문서는 Inflnara 플랫폼의 PostgreSQL 데이터베이스 백업 및 복구 전략을 정의합니다. 실제 운영 환경에 맞게 설정을 조정하시기 바랍니다. 