# Kế hoạch triển khai Ứng dụng Dữ liệu Phân tán (Distributed Data)

> Tài liệu tóm tắt toàn bộ kế hoạch: mục tiêu, kiến trúc, bước triển khai, kiểm thử, bảo mật, rollback và timeline.

---

## 1. Mục tiêu ✅

- Tạo bản **phiên bản phân tán** của VieGo Blog (Primary + Replicas) mà **không ảnh hưởng** đến phiên bản hiện tại (production).
- Hỗ trợ test song song, rollback dễ, và có lộ trình merging khi sẵn sàng.

## 2. Chiến lược chính 🎯

- Sử dụng **Git branch**: tạo nhánh `feature/distributed-data` để phát triển.
- **Clone** database hiện tại sang database mới (`viego_blog_distributed`) để thử nghiệm.
- Dùng **Docker Compose** để tạo 1 Primary + 2–3 Replicas (có thể chạy local trên máy của bạn) để mô phỏng môi trường phân tán.
- Triển khai monitoring, backup và scripts tự động (PowerShell / Bash / Python).

## 3. Kiến trúc đề xuất 🔧

- Local dev / Test: Docker containers trên cùng 1 máy (Ports: 3306 primary, 3307/3308 replicas).
- Production-ready: Multi-machine (Primary public IP + Replicas remote) với VPN hoặc Firewall rules.
- Database router trong ứng dụng (write → primary, read → replicas).

## 4. Tiền chuẩn bị (Prerequisites) ✔️

- Sao lưu code: commit & push `main` trước khi tạo branch.
- Cài: Docker + docker-compose, Python 3.8+, pip packages (requirements.txt), MySQL client, PowerShell (Windows).
- Quyền truy cập MySQL root trên máy local.

## 5. Bước triển khai chi tiết (Tasks) 🛠️

### 5.1 Tạo branch & môi trường code

1. `git checkout -b feature/distributed-data`
2. Tạo file `.env.distributed` (cấu hình DB mới, ports, replication settings).

### 5.2 Clone database

- Dùng `mysqldump` hoặc script PowerShell để sao chép `viego_blog` → `viego_blog_distributed`.

### 5.3 Tạo Docker Compose cho Distributed

- Tạo `docker-compose.distributed.yml` chứa:
  - `mysql-primary` (server-id=1)
  - `mysql-replica1` (server-id=2)
  - `mysql-replica2` (server-id=3)
  - Optional: replica3 (port 3309)
- File cấu hình: `database/my-primary.cnf`, `database/my-replica.cnf`.

### 5.4 Script tự động hóa

- PowerShell wizard: `scripts/setup_3_servers_auto.ps1` (detect LAN/WAN, generate `.env`, test connectivity).
- Python setup: `backend/setup_distributed_multi_machine.py` (setup replication via SQL commands, verify replication).
- Script Docker setup: `scripts/setup_docker_replication.ps1` (start containers, configure replication, verify).

### 5.5 Cập nhật backend

- Thêm cấu hình `REPLICATION_ENABLED` và load-balancer logic (read vs write) trong `backend/main.py` hoặc `utils/db_load_balancer.py`.
- Add admin route `/admin/db/replication-status` để kiểm tra trạng thái replicas.

### 5.6 Kiểm thử

- Functional tests: Insert vào primary → verify replicas.
- Integration tests: chạy test suite (`backend/tests`) với `DB=viego_blog_distributed`.
- Load tests cơ bản (JMeter / locust): kiểm tra read throughput với replicas.

## 6. Bảo mật & Network 🔒

- Nếu multi-machine: dùng **VPN** hoặc giới hạn firewall (chỉ cho IP các replicas) và bật SSL cho MySQL nếu cần.
- Tạo user replication với quyền hạn minimal: `GRANT REPLICATION SLAVE ON *.* TO 'repl'@'%' IDENTIFIED BY '...'`.
- Kiểm soát secrets: `.env.distributed` không commit, thêm vào `.gitignore`.

## 7. Backup & Recovery 🧰

- Thiết lập backup hàng ngày (mysqldump hoặc physical backup) cho Primary.
- Kiểm tra restore procedure trên database `viego_blog_distributed`.
- Keeppoint: trước mỗi migration lớn, tạo snapshot DB.

## 8. Monitoring & Alerting 📈

- Kiểm tra replica lag: `SHOW REPLICA STATUS` → `Replica_IO_Running`, `Replica_SQL_Running`, `Seconds_Behind_Source`.
- Tích hợp alert (email/Slack) khi `Seconds_Behind_Source > threshold` hoặc replica down.
- Optional: Prometheus + Grafana (metrics exporter cho MySQL)

## 9. CI / CD & Deployment 🔁

- Tạo pipeline cho branch `feature/distributed-data`:
  - Steps: lint → unit tests → spin up docker-compose.distributed → integration tests → teardown
- Sau khi test OK, quyết định merge vào `main` hoặc cherry-pick các commits mong muốn.

## 10. Rollout & Rollback Plan ↩️

- Rollout sequence:
  1. Merge changes to staging branch + deploy to staging with distributed DB.
  2. Run full tests & smoke tests.
  3. Schedule production maintenance window.
  4. Deploy migration + enable replication.
- Rollback:
  - Nếu lỗi nghiêm trọng, revert migration & code (`git revert` hoặc `git checkout main`), restore DB từ snapshot.

## 11. Timeline gợi ý 🗓️

- Day 0: Prep, backup, create branch
- Day 1: Build docker-compose, clone DB, local verification
- Day 2: Implement replication scripts & load balancer, add tests
- Day 3: Monitoring & alerting, CI integration
- Day 4: Staging deploy & smoke tests
- Day 5+: Production rollout (tùy scope)

## 12. Checklist (Quick) ✅

- [ ] Commit & push `main` (backup)
- [ ] Create branch `feature/distributed-data`
- [ ] Create `.env.distributed` (kept local)
- [ ] Clone DB to `viego_blog_distributed`
- [ ] Create `docker-compose.distributed.yml` and CNF files
- [ ] Implement `setup_distributed_multi_machine.py`
- [ ] Run replication wizard and verify
- [ ] Add DB router / load balancer to backend
- [ ] Add monitoring route + setup alerts
- [ ] Add CI job for distributed tests
- [ ] Document process in repo (`docs/DISTRIBUTED_DATA_PLAN.md`)

## 13. Acceptance criteria ✓

- Replication running: all replicas `Replica_IO_Running=Yes` & `Replica_SQL_Running=Yes`.
- Test insertion on primary appears on replicas within acceptable lag.
- Integration test suite passes against distributed DB.
- Documented and repeatable scripts for setup & teardown.

---

## Liên hệ & bước tiếp theo 💬

- Tôi có thể: tạo file script, docker compose, và route monitoring tự động trong repo. Bạn muốn tôi bắt đầu với việc nào trước: **(A)** Tạo Docker Compose + scripts, **(B)** Tạo branch & clone DB script, hay **(C)** Thêm monitoring route + CI config?

---

_File tạo tự động: `docs/DISTRIBUTED_DATA_PLAN.md`_
