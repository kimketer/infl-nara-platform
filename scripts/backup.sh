#!/bin/bash

# Inflnara Platform Backup Script
# This script performs automated backups of the database and application data

set -e

# Configuration
BACKUP_DIR="/backup"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="${DATABASE_NAME:-inflnara}"
DB_USER="${DATABASE_USERNAME:-postgres}"
DB_HOST="${DATABASE_HOST:-postgres}"
DB_PORT="${DATABASE_PORT:-5432}"
RETENTION_DAYS=30
RETENTION_WEEKS=12
RETENTION_MONTHS=12

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

# Create backup directories
create_directories() {
    log "Creating backup directories..."
    mkdir -p "$BACKUP_DIR/daily"
    mkdir -p "$BACKUP_DIR/weekly"
    mkdir -p "$BACKUP_DIR/monthly"
    mkdir -p "$BACKUP_DIR/logs"
    mkdir -p "$BACKUP_DIR/uploads"
}

# Database backup function
backup_database() {
    local backup_type=$1
    local backup_file="$BACKUP_DIR/$backup_type/inflnara_${DATE}.sql"
    local compressed_file="${backup_file}.gz"
    
    log "Starting database backup ($backup_type)..."
    
    # Check if database is accessible
    if ! pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME"; then
        error "Database is not accessible"
        return 1
    fi
    
    # Perform database backup
    start_time=$(date +%s)
    
    if pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        --verbose --clean --no-owner --no-privileges \
        --exclude-table=backup_log \
        > "$backup_file"; then
        
        end_time=$(date +%s)
        duration=$((end_time - start_time))
        
        # Compress backup file
        gzip "$backup_file"
        
        # Get file size
        file_size=$(stat -c%s "$compressed_file")
        file_size_mb=$(echo "scale=2; $file_size / 1024 / 1024" | bc)
        
        log "Database backup completed successfully"
        info "File: $compressed_file"
        info "Size: ${file_size_mb}MB"
        info "Duration: ${duration}s"
        
        # Log backup to database
        log_backup_to_db "$backup_type" "$compressed_file" "$file_size_mb" "$duration"
        
        return 0
    else
        error "Database backup failed"
        return 1
    fi
}

# Log backup to database
log_backup_to_db() {
    local backup_type=$1
    local backup_file=$2
    local file_size_mb=$3
    local duration=$4
    
    # Create backup_log table if it doesn't exist
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
        CREATE TABLE IF NOT EXISTS backup_log (
            id SERIAL PRIMARY KEY,
            backup_type VARCHAR(20) NOT NULL,
            backup_file VARCHAR(255) NOT NULL,
            backup_size_mb DECIMAL(10,2),
            backup_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            duration_seconds INTEGER,
            status VARCHAR(20) DEFAULT 'success',
            error_message TEXT
        );
    " > /dev/null 2>&1
    
    # Insert backup log
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
        INSERT INTO backup_log (backup_type, backup_file, backup_size_mb, duration_seconds, status)
        VALUES ('$backup_type', '$backup_file', $file_size_mb, $duration, 'success');
    " > /dev/null 2>&1
}

# Application data backup
backup_application_data() {
    log "Starting application data backup..."
    
    # Backup uploads directory if it exists
    if [ -d "/app/uploads" ]; then
        local uploads_backup="$BACKUP_DIR/uploads/inflnara_uploads_${DATE}.tar.gz"
        tar -czf "$uploads_backup" -C /app uploads
        log "Application uploads backed up to: $uploads_backup"
    fi
    
    # Backup logs directory if it exists
    if [ -d "/app/logs" ]; then
        local logs_backup="$BACKUP_DIR/logs/inflnara_logs_${DATE}.tar.gz"
        tar -czf "$logs_backup" -C /app logs
        log "Application logs backed up to: $logs_backup"
    fi
}

# Cleanup old backups
cleanup_old_backups() {
    log "Cleaning up old backups..."
    
    # Remove daily backups older than retention period
    find "$BACKUP_DIR/daily" -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete 2>/dev/null || true
    find "$BACKUP_DIR/daily" -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete 2>/dev/null || true
    
    # Remove weekly backups older than retention period
    find "$BACKUP_DIR/weekly" -name "*.sql.gz" -mtime +$((RETENTION_WEEKS * 7)) -delete 2>/dev/null || true
    find "$BACKUP_DIR/weekly" -name "*.tar.gz" -mtime +$((RETENTION_WEEKS * 7)) -delete 2>/dev/null || true
    
    # Remove monthly backups older than retention period
    find "$BACKUP_DIR/monthly" -name "*.sql.gz" -mtime +$((RETENTION_MONTHS * 30)) -delete 2>/dev/null || true
    find "$BACKUP_DIR/monthly" -name "*.tar.gz" -mtime +$((RETENTION_MONTHS * 30)) -delete 2>/dev/null || true
    
    log "Cleanup completed"
}

# Verify backup integrity
verify_backup() {
    local backup_file=$1
    
    log "Verifying backup integrity: $backup_file"
    
    if [[ $backup_file == *.gz ]]; then
        if gunzip -t "$backup_file"; then
            log "Backup file integrity verified"
            return 0
        else
            error "Backup file integrity check failed"
            return 1
        fi
    else
        warn "Skipping integrity check for uncompressed file"
        return 0
    fi
}

# Send notification
send_notification() {
    local status=$1
    local message=$2
    
    # Send to Slack if webhook is configured
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"[Inflnara Backup] $status: $message\"}" \
            "$SLACK_WEBHOOK_URL" > /dev/null 2>&1 || true
    fi
    
    # Send email notification if configured
    if [ -n "$SENDGRID_API_KEY" ] && [ -n "$ALERT_EMAIL" ]; then
        # This would require a more complex email sending setup
        warn "Email notification not implemented in this script"
    fi
}

# Main backup function
main_backup() {
    local backup_type=${1:-daily}
    
    log "Starting Inflnara platform backup (type: $backup_type)"
    
    # Create directories
    create_directories
    
    # Perform database backup
    if backup_database "$backup_type"; then
        # Verify the backup
        local backup_file="$BACKUP_DIR/$backup_type/inflnara_${DATE}.sql.gz"
        if verify_backup "$backup_file"; then
            # Backup application data
            backup_application_data
            
            # Cleanup old backups
            cleanup_old_backups
            
            log "Backup completed successfully"
            send_notification "SUCCESS" "Backup completed successfully for $backup_type"
        else
            error "Backup verification failed"
            send_notification "FAILED" "Backup verification failed for $backup_type"
            return 1
        fi
    else
        error "Database backup failed"
        send_notification "FAILED" "Database backup failed for $backup_type"
        return 1
    fi
}

# Show backup statistics
show_stats() {
    log "Backup Statistics:"
    
    # Count files in each directory
    daily_count=$(find "$BACKUP_DIR/daily" -name "*.sql.gz" | wc -l)
    weekly_count=$(find "$BACKUP_DIR/weekly" -name "*.sql.gz" | wc -l)
    monthly_count=$(find "$BACKUP_DIR/monthly" -name "*.sql.gz" | wc -l)
    
    info "Daily backups: $daily_count"
    info "Weekly backups: $weekly_count"
    info "Monthly backups: $monthly_count"
    
    # Show total size
    total_size=$(du -sh "$BACKUP_DIR" | cut -f1)
    info "Total backup size: $total_size"
    
    # Show latest backup
    latest_backup=$(find "$BACKUP_DIR" -name "*.sql.gz" -type f -printf '%T@ %p\n' | sort -n | tail -1 | cut -f2- -d" ")
    if [ -n "$latest_backup" ]; then
        info "Latest backup: $latest_backup"
    fi
}

# Show usage
usage() {
    echo "Usage: $0 [daily|weekly|monthly|stats]"
    echo ""
    echo "Commands:"
    echo "  daily    - Perform daily backup (default)"
    echo "  weekly   - Perform weekly backup"
    echo "  monthly  - Perform monthly backup"
    echo "  stats    - Show backup statistics"
    echo ""
    echo "Environment variables:"
    echo "  DATABASE_NAME     - Database name (default: inflnara)"
    echo "  DATABASE_USERNAME - Database username (default: postgres)"
    echo "  DATABASE_HOST     - Database host (default: postgres)"
    echo "  DATABASE_PORT     - Database port (default: 5432)"
    echo "  BACKUP_DIR        - Backup directory (default: /backup)"
    echo "  SLACK_WEBHOOK_URL - Slack webhook URL for notifications"
    echo "  ALERT_EMAIL       - Email address for notifications"
}

# Main script logic
case "${1:-daily}" in
    daily|weekly|monthly)
        main_backup "$1"
        ;;
    stats)
        show_stats
        ;;
    help|--help|-h)
        usage
        ;;
    *)
        error "Invalid command: $1"
        usage
        exit 1
        ;;
esac 