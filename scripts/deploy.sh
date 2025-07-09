#!/bin/bash

# Inflnara Platform Production Deployment Script
# This script handles the complete deployment process for the Inflnara platform

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_ROOT/.env.production"
DOCKER_COMPOSE_FILE="$PROJECT_ROOT/docker-compose.prod.yml"
BACKUP_DIR="$PROJECT_ROOT/backup"
LOGS_DIR="$PROJECT_ROOT/logs"
UPLOADS_DIR="$PROJECT_ROOT/uploads"

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

# Show usage
usage() {
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  deploy     - Deploy the application (default)"
    echo "  rollback   - Rollback to previous version"
    echo "  backup     - Create backup before deployment"
    echo "  restore    - Restore from backup"
    echo "  health     - Check system health"
    echo "  logs       - Show application logs"
    echo "  stop       - Stop all services"
    echo "  start      - Start all services"
    echo "  restart    - Restart all services"
    echo "  update     - Update application code"
    echo "  ssl        - Renew SSL certificates"
    echo "  monitor    - Show monitoring status"
    echo ""
    echo "Options:"
    echo "  --env-file FILE    - Use specific environment file"
    echo "  --backup           - Create backup before deployment"
    echo "  --no-cache         - Build without cache"
    echo "  --force            - Force deployment without confirmation"
    echo "  --version VERSION  - Deploy specific version"
    echo ""
    echo "Examples:"
    echo "  $0 deploy --backup"
    echo "  $0 rollback"
    echo "  $0 health"
    echo "  $0 logs --follow"
}

# Check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        error "This script should not be run as root"
        exit 1
    fi
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed"
        exit 1
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed"
        exit 1
    fi
    
    # Check if environment file exists
    if [ ! -f "$ENV_FILE" ]; then
        error "Environment file not found: $ENV_FILE"
        echo "Please copy env.production.example to .env.production and configure it"
        exit 1
    fi
    
    # Check if docker-compose file exists
    if [ ! -f "$DOCKER_COMPOSE_FILE" ]; then
        error "Docker Compose file not found: $DOCKER_COMPOSE_FILE"
        exit 1
    fi
    
    log "Prerequisites check passed"
}

# Load environment variables
load_environment() {
    log "Loading environment variables..."
    
    if [ -f "$ENV_FILE" ]; then
        export $(grep -v '^#' "$ENV_FILE" | xargs)
        log "Environment variables loaded from $ENV_FILE"
    else
        error "Environment file not found: $ENV_FILE"
        exit 1
    fi
}

# Create necessary directories
create_directories() {
    log "Creating necessary directories..."
    
    mkdir -p "$BACKUP_DIR"
    mkdir -p "$LOGS_DIR"
    mkdir -p "$UPLOADS_DIR"
    mkdir -p "$PROJECT_ROOT/nginx/ssl"
    mkdir -p "$PROJECT_ROOT/nginx/www"
    mkdir -p "$PROJECT_ROOT/monitoring/prometheus"
    mkdir -p "$PROJECT_ROOT/monitoring/grafana"
    
    log "Directories created successfully"
}

# Create backup
create_backup() {
    log "Creating backup before deployment..."
    
    local backup_name="inflnara_backup_$(date +%Y%m%d_%H%M%S)"
    local backup_path="$BACKUP_DIR/$backup_name"
    
    mkdir -p "$backup_path"
    
    # Backup database
    if docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T postgres pg_dump -U postgres inflnara > "$backup_path/database.sql" 2>/dev/null; then
        log "Database backup created: $backup_path/database.sql"
    else
        warn "Database backup failed (database might not be running)"
    fi
    
    # Backup uploads
    if [ -d "$UPLOADS_DIR" ]; then
        tar -czf "$backup_path/uploads.tar.gz" -C "$PROJECT_ROOT" uploads
        log "Uploads backup created: $backup_path/uploads.tar.gz"
    fi
    
    # Backup logs
    if [ -d "$LOGS_DIR" ]; then
        tar -czf "$backup_path/logs.tar.gz" -C "$PROJECT_ROOT" logs
        log "Logs backup created: $backup_path/logs.tar.gz"
    fi
    
    # Create backup manifest
    cat > "$backup_path/manifest.json" << EOF
{
    "backup_name": "$backup_name",
    "created_at": "$(date -Iseconds)",
    "version": "${DEPLOYMENT_VERSION:-unknown}",
    "files": [
        "database.sql",
        "uploads.tar.gz",
        "logs.tar.gz"
    ]
}
EOF
    
    log "Backup completed: $backup_path"
}

# Check system health
check_health() {
    log "Checking system health..."
    
    local services=("api" "web" "nginx" "postgres" "redis" "prometheus" "grafana")
    local all_healthy=true
    
    for service in "${services[@]}"; do
        if docker-compose -f "$DOCKER_COMPOSE_FILE" ps "$service" | grep -q "Up"; then
            log "✓ $service is running"
        else
            error "✗ $service is not running"
            all_healthy=false
        fi
    done
    
    # Check API health endpoint
    if curl -f -s http://localhost:3000/health > /dev/null 2>&1; then
        log "✓ API health check passed"
    else
        error "✗ API health check failed"
        all_healthy=false
    fi
    
    # Check web health endpoint
    if curl -f -s http://localhost:3001/health > /dev/null 2>&1; then
        log "✓ Web health check passed"
    else
        error "✗ Web health check failed"
        all_healthy=false
    fi
    
    if [ "$all_healthy" = true ]; then
        log "All services are healthy"
        return 0
    else
        error "Some services are unhealthy"
        return 1
    fi
}

# Deploy application
deploy() {
    log "Starting deployment..."
    
    # Check if backup is requested
    if [[ "$*" == *"--backup"* ]]; then
        create_backup
    fi
    
    # Stop existing services
    log "Stopping existing services..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" down
    
    # Pull latest images
    log "Pulling latest images..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" pull
    
    # Build images
    log "Building images..."
    local build_args=""
    if [[ "$*" == *"--no-cache"* ]]; then
        build_args="--no-cache"
    fi
    docker-compose -f "$DOCKER_COMPOSE_FILE" build $build_args
    
    # Start services
    log "Starting services..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" up -d
    
    # Wait for services to be ready
    log "Waiting for services to be ready..."
    sleep 30
    
    # Check health
    if check_health; then
        log "Deployment completed successfully"
        
        # Show service status
        docker-compose -f "$DOCKER_COMPOSE_FILE" ps
        
        # Show URLs
        info "Application URLs:"
        info "  Frontend: https://inflnara.com"
        info "  API: https://api.inflnara.com"
        info "  Grafana: http://localhost:3002"
        info "  Prometheus: http://localhost:9090"
        
    else
        error "Deployment failed - some services are unhealthy"
        return 1
    fi
}

# Rollback to previous version
rollback() {
    log "Starting rollback..."
    
    # Find latest backup
    local latest_backup=$(find "$BACKUP_DIR" -name "inflnara_backup_*" -type d | sort | tail -1)
    
    if [ -z "$latest_backup" ]; then
        error "No backup found for rollback"
        return 1
    fi
    
    log "Rolling back to: $latest_backup"
    
    # Stop services
    docker-compose -f "$DOCKER_COMPOSE_FILE" down
    
    # Restore database
    if [ -f "$latest_backup/database.sql" ]; then
        log "Restoring database..."
        docker-compose -f "$DOCKER_COMPOSE_FILE" up -d postgres
        sleep 10
        docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T postgres psql -U postgres -d inflnara -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
        docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T postgres psql -U postgres -d inflnara < "$latest_backup/database.sql"
    fi
    
    # Restore uploads
    if [ -f "$latest_backup/uploads.tar.gz" ]; then
        log "Restoring uploads..."
        tar -xzf "$latest_backup/uploads.tar.gz" -C "$PROJECT_ROOT"
    fi
    
    # Start services
    docker-compose -f "$DOCKER_COMPOSE_FILE" up -d
    
    # Check health
    sleep 30
    if check_health; then
        log "Rollback completed successfully"
    else
        error "Rollback failed"
        return 1
    fi
}

# Show logs
show_logs() {
    local service=${1:-""}
    local follow=${2:-""}
    
    if [ -n "$service" ]; then
        log "Showing logs for $service..."
        docker-compose -f "$DOCKER_COMPOSE_FILE" logs $follow "$service"
    else
        log "Showing all logs..."
        docker-compose -f "$DOCKER_COMPOSE_FILE" logs $follow
    fi
}

# Stop services
stop_services() {
    log "Stopping all services..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" down
    log "All services stopped"
}

# Start services
start_services() {
    log "Starting all services..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" up -d
    log "All services started"
}

# Restart services
restart_services() {
    log "Restarting all services..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" restart
    log "All services restarted"
}

# Update application
update_application() {
    log "Updating application..."
    
    # Pull latest code
    git pull origin main
    
    # Rebuild and deploy
    deploy "$@"
}

# Renew SSL certificates
renew_ssl() {
    log "Renewing SSL certificates..."
    
    # Stop nginx temporarily
    docker-compose -f "$DOCKER_COMPOSE_FILE" stop nginx
    
    # Run certbot
    docker-compose -f "$DOCKER_COMPOSE_FILE" run --rm certbot renew
    
    # Start nginx
    docker-compose -f "$DOCKER_COMPOSE_FILE" start nginx
    
    log "SSL certificates renewed"
}

# Show monitoring status
show_monitoring() {
    log "Monitoring Status:"
    
    # Prometheus status
    if curl -f -s http://localhost:9090/-/healthy > /dev/null 2>&1; then
        log "✓ Prometheus is running"
    else
        error "✗ Prometheus is not running"
    fi
    
    # Grafana status
    if curl -f -s http://localhost:3002/api/health > /dev/null 2>&1; then
        log "✓ Grafana is running"
    else
        error "✗ Grafana is not running"
    fi
    
    # Show monitoring URLs
    info "Monitoring URLs:"
    info "  Grafana: http://localhost:3002 (admin/admin123)"
    info "  Prometheus: http://localhost:9090"
}

# Cleanup old backups
cleanup_backups() {
    log "Cleaning up old backups..."
    
    # Remove backups older than 30 days
    find "$BACKUP_DIR" -name "inflnara_backup_*" -type d -mtime +30 -exec rm -rf {} \;
    
    log "Cleanup completed"
}

# Main script logic
main() {
    local command=${1:-deploy}
    shift || true
    
    # Check if running as root
    check_root
    
    # Check prerequisites
    check_prerequisites
    
    # Load environment
    load_environment
    
    # Create directories
    create_directories
    
    # Execute command
    case "$command" in
        deploy)
            deploy "$@"
            ;;
        rollback)
            rollback
            ;;
        backup)
            create_backup
            ;;
        health)
            check_health
            ;;
        logs)
            show_logs "$@"
            ;;
        stop)
            stop_services
            ;;
        start)
            start_services
            ;;
        restart)
            restart_services
            ;;
        update)
            update_application "$@"
            ;;
        ssl)
            renew_ssl
            ;;
        monitor)
            show_monitoring
            ;;
        cleanup)
            cleanup_backups
            ;;
        help|--help|-h)
            usage
            ;;
        *)
            error "Unknown command: $command"
            usage
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@" 