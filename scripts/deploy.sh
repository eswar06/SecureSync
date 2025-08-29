#!/bin/bash

# SecureSync Pro Deployment Script
# This script deploys SecureSync Pro to Kubernetes cluster

set -e

# Configuration
NAMESPACE=${NAMESPACE:-"securesync-pro"}
ENVIRONMENT=${ENVIRONMENT:-"production"}
KUBECTL_TIMEOUT=${KUBECTL_TIMEOUT:-"300s"}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if kubectl is installed
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl is not installed or not in PATH"
        exit 1
    fi
    
    # Check if helm is installed
    if ! command -v helm &> /dev/null; then
        log_warning "helm is not installed, some features may not work"
    fi
    
    # Check kubectl connection
    if ! kubectl cluster-info &> /dev/null; then
        log_error "Cannot connect to Kubernetes cluster"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Create namespace if it doesn't exist
create_namespace() {
    log_info "Creating namespace: $NAMESPACE"
    
    if kubectl get namespace "$NAMESPACE" &> /dev/null; then
        log_info "Namespace $NAMESPACE already exists"
    else
        kubectl apply -f kubernetes/namespace.yaml
        log_success "Namespace $NAMESPACE created"
    fi
}

# Deploy database components
deploy_database() {
    log_info "Deploying database components..."
    
    # Deploy MongoDB
    log_info "Deploying MongoDB..."
    kubectl apply -f kubernetes/mongodb.yaml -n "$NAMESPACE"
    kubectl rollout status deployment/mongodb -n "$NAMESPACE" --timeout="$KUBECTL_TIMEOUT"
    
    # Deploy Redis
    log_info "Deploying Redis..."
    kubectl apply -f kubernetes/redis.yaml -n "$NAMESPACE"
    kubectl rollout status deployment/redis -n "$NAMESPACE" --timeout="$KUBECTL_TIMEOUT"
    
    log_success "Database components deployed successfully"
}

# Deploy backend services
deploy_backend() {
    log_info "Deploying backend services..."
    
    kubectl apply -f kubernetes/backend.yaml -n "$NAMESPACE"
    kubectl rollout status deployment/backend -n "$NAMESPACE" --timeout="$KUBECTL_TIMEOUT"
    
    log_success "Backend services deployed successfully"
}

# Deploy frontend services
deploy_frontend() {
    log_info "Deploying frontend services..."
    
    kubectl apply -f kubernetes/frontend.yaml -n "$NAMESPACE"
    kubectl rollout status deployment/frontend -n "$NAMESPACE" --timeout="$KUBECTL_TIMEOUT"
    
    log_success "Frontend services deployed successfully"
}

# Deploy ingress
deploy_ingress() {
    log_info "Deploying ingress configuration..."
    
    kubectl apply -f kubernetes/ingress.yaml -n "$NAMESPACE"
    
    log_success "Ingress configuration deployed successfully"
}

# Deploy monitoring stack
deploy_monitoring() {
    log_info "Deploying monitoring stack..."
    
    kubectl apply -f kubernetes/monitoring.yaml -n "$NAMESPACE"
    
    # Wait for Prometheus to be ready
    kubectl rollout status deployment/prometheus -n "$NAMESPACE" --timeout="$KUBECTL_TIMEOUT"
    
    # Wait for Grafana to be ready
    kubectl rollout status deployment/grafana -n "$NAMESPACE" --timeout="$KUBECTL_TIMEOUT"
    
    log_success "Monitoring stack deployed successfully"
}

# Health check
health_check() {
    log_info "Performing health checks..."
    
    # Check if all pods are running
    local failed_pods=$(kubectl get pods -n "$NAMESPACE" --field-selector=status.phase!=Running --no-headers | wc -l)
    
    if [ "$failed_pods" -gt 0 ]; then
        log_error "Some pods are not in Running state:"
        kubectl get pods -n "$NAMESPACE" --field-selector=status.phase!=Running
        return 1
    fi
    
    # Check if services are accessible
    log_info "Checking service endpoints..."
    
    # Test backend health endpoint
    if kubectl exec -n "$NAMESPACE" deployment/backend -- curl -f http://localhost:5000/health &> /dev/null; then
        log_success "Backend health check passed"
    else
        log_error "Backend health check failed"
        return 1
    fi
    
    # Test frontend
    if kubectl exec -n "$NAMESPACE" deployment/frontend -- curl -f http://localhost:80/health &> /dev/null; then
        log_success "Frontend health check passed"
    else
        log_error "Frontend health check failed"
        return 1
    fi
    
    log_success "All health checks passed"
}

# Cleanup function
cleanup() {
    if [ $? -ne 0 ]; then
        log_error "Deployment failed. Check the logs above for details."
        log_info "You can check the status with: kubectl get pods -n $NAMESPACE"
        log_info "View logs with: kubectl logs -l app=<app-name> -n $NAMESPACE"
    fi
}

# Show deployment information
show_deployment_info() {
    log_info "Deployment completed successfully!"
    echo
    log_info "Deployment Information:"
    echo "  Namespace: $NAMESPACE"
    echo "  Environment: $ENVIRONMENT"
    echo
    
    log_info "Service Status:"
    kubectl get pods -n "$NAMESPACE" -o wide
    echo
    
    log_info "Service URLs:"
    kubectl get ingress -n "$NAMESPACE"
    echo
    
    log_info "Useful Commands:"
    echo "  View pods: kubectl get pods -n $NAMESPACE"
    echo "  View services: kubectl get services -n $NAMESPACE"
    echo "  View logs: kubectl logs -l app=<app-name> -n $NAMESPACE"
    echo "  Port forward backend: kubectl port-forward -n $NAMESPACE service/backend-service 5000:5000"
    echo "  Port forward frontend: kubectl port-forward -n $NAMESPACE service/frontend-service 3000:80"
    echo "  Port forward Grafana: kubectl port-forward -n $NAMESPACE service/grafana-service 3000:3000"
    echo "  Port forward Prometheus: kubectl port-forward -n $NAMESPACE service/prometheus-service 9090:9090"
}

# Rollback function
rollback() {
    log_warning "Rolling back deployment..."
    
    # Rollback backend
    if kubectl rollout history deployment/backend -n "$NAMESPACE" &> /dev/null; then
        kubectl rollout undo deployment/backend -n "$NAMESPACE"
        kubectl rollout status deployment/backend -n "$NAMESPACE" --timeout="$KUBECTL_TIMEOUT"
    fi
    
    # Rollback frontend
    if kubectl rollout history deployment/frontend -n "$NAMESPACE" &> /dev/null; then
        kubectl rollout undo deployment/frontend -n "$NAMESPACE"
        kubectl rollout status deployment/frontend -n "$NAMESPACE" --timeout="$KUBECTL_TIMEOUT"
    fi
    
    log_success "Rollback completed"
}

# Main deployment function
main() {
    log_info "Starting SecureSync Pro deployment to $ENVIRONMENT environment"
    
    # Set trap for cleanup
    trap cleanup EXIT
    
    # Check command line arguments
    case "${1:-}" in
        "rollback")
            rollback
            exit 0
            ;;
        "health-check")
            health_check
            exit 0
            ;;
        "monitoring-only")
            check_prerequisites
            create_namespace
            deploy_monitoring
            exit 0
            ;;
        "")
            # Full deployment
            ;;
        *)
            echo "Usage: $0 [rollback|health-check|monitoring-only]"
            exit 1
            ;;
    esac
    
    # Perform full deployment
    check_prerequisites
    create_namespace
    deploy_database
    deploy_backend
    deploy_frontend
    deploy_ingress
    deploy_monitoring
    
    # Wait a bit for services to stabilize
    log_info "Waiting for services to stabilize..."
    sleep 30
    
    # Perform health checks
    health_check
    
    # Show deployment information
    show_deployment_info
    
    # Remove trap
    trap - EXIT
    
    log_success "SecureSync Pro deployment completed successfully!"
}

# Run main function
main "$@"
