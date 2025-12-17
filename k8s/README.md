# ILAI Kubernetes Deployment

This directory contains Kubernetes manifests for deploying the ILAI application.

## Structure
```
k8s/
├── namespace.yaml          # ilai namespace
├── configmap.yaml          # shared configuration
├── secrets.yaml            # sensitive data (template - fill in values)
├── postgres/               # database deployment
├── redis/                  # cache deployment
├── services/               # all microservices
│   ├── auth-service.yaml
│   ├── notes-service.yaml
│   ├── ai-service.yaml
│   ├── feed-service.yaml
│   └── frontend.yaml
├── ingress.yaml            # nginx ingress controller config
└── hpa.yaml                # horizontal pod autoscaler
```

## Quick Start

1. **Create namespace and configs:**
   ```bash
   kubectl apply -f k8s/namespace.yaml
   kubectl apply -f k8s/configmap.yaml
   kubectl apply -f k8s/secrets.yaml
   ```

2. **Deploy infrastructure:**
   ```bash
   kubectl apply -f k8s/postgres/
   kubectl apply -f k8s/redis/
   ```

3. **Deploy services:**
   ```bash
   kubectl apply -f k8s/services/
   ```

4. **Setup ingress:**
   ```bash
   kubectl apply -f k8s/ingress.yaml
   ```

## Scaling
```bash
kubectl scale deployment notes-service --replicas=3 -n ilai
```

## Monitoring
```bash
kubectl get pods -n ilai
kubectl logs -f deployment/notes-service -n ilai
```
