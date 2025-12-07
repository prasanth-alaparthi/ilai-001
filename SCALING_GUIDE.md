# Scaling Guide: Running 10-15 Microservices

Adding 5-10 more services will bring your total to **10-15 microservices**. This significantly changes your infrastructure requirements.

## 1. The "RAM Problem" (Critical)

Java Spring Boot applications are memory-intensive.
- **Average RAM per Service**: ~400MB - 700MB (Heap + Non-Heap + OS overhead).
- **Calculation**: 15 services × 500MB = **7.5 GB RAM**.
- **Database + OS + Overhead**: ~2-3 GB.
- **Total Required**: **~10-12 GB RAM**.

**Impact**: If you try to run this on the `e2-standard-2` (8GB RAM) VM recommended earlier, your server will crash (Out of Memory Error).

### **Recommendation: Upgrade VM**
You need a machine with at least **16GB RAM**.
- **Google Cloud**: Change machine type to **`e2-standard-4`** (4 vCPU, 16 GB memory).
- **Cost**: This doubles your VM cost (approx. $100/month vs $50/month), but it is necessary for stability.

---

## 2. Cost-Saving Strategy: Spot Instances

To offset the cost of a larger VM, use **Spot VMs** (Google Cloud) or **Preemptible Instances**.
- **What**: Google sells unused capacity at a 60-90% discount.
- **Catch**: They can shut down the VM at any time (rarely happens if you choose a stable region, but possible).
- **Solution**: Set up an instance group that automatically restarts the VM if it's preempted.
- **Savings**: An `e2-standard-4` Spot VM might cost *less* than a regular `e2-standard-2`.

---

## 3. Alternative: Google Cloud Run (Serverless)

If your new services are not used constantly, consider **Google Cloud Run**.
- **How it works**: You deploy your container, and Google runs it only when a request comes in.
- **Pros**:
    - **Scale to Zero**: You pay $0 when no one is using the service.
    - **No Server Management**: No VM to manage.
- **Cons**:
    - **Cold Starts**: Java apps take 5-10 seconds to start. The first user to hit a service might wait 10s.
    - **Complexity**: You need to manage networking (VPC Connector) so Cloud Run services can talk to your VM/Database.

**Verdict**: Stick to the **VM approach** for now. It's simpler. Only use Cloud Run if you optimize your Java apps for fast startup (using GraalVM).

---

## 4. Operational Complexity

With 15 services, `docker-compose` is still manageable, but you need to be organized.

### **A. Centralized Logs**
Checking 15 separate log files is hard.
- **Simple**: Use `docker-compose logs -f --tail=100` to see a stream of all logs.
- **Pro**: Install a lightweight log viewer like **Dozzle** (adds a web UI for Docker logs).
    ```yaml
    # Add to docker-compose.yml
    dozzle:
      image: amir20/dozzle:latest
      volumes:
        - /var/run/docker.sock:/var/run/docker.sock
      ports:
        - 8888:8080
    ```

### **B. API Gateway**
You are currently using Nginx as a gateway. This is fine, but your `nginx.conf` will get large.
- Keep adding `location /api/service-name` blocks.
- Ensure you document which service does what.

---

## Summary Checklist for Expansion

1.  [ ] **Upgrade VM**: Select `e2-standard-4` (16GB RAM) when creating your Google Cloud instance.
2.  [ ] **Adjust JVM Memory**: Explicitly limit memory for each service in `docker-compose.yml` to prevent one service from eating all RAM.
    ```yaml
    environment:
      JAVA_TOOL_OPTIONS: "-Xms256m -Xmx512m"
    ```
3.  [ ] **Monitoring**: Add **Dozzle** to your docker-compose for easy log viewing.
