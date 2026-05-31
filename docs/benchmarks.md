# Benchmarks

Local benchmarks from a macOS ARM machine. These are not lab-grade results; they are meant to
compare the same Pi workload across runtimes on one machine.

Tools:

- `hyperfine` for wall time, user CPU time, and system CPU time
- `/usr/bin/time -l` for max RSS on macOS

## Four-way hyperfine run

20 runs, 3 warmups.

### `--version`

| Runtime    |               Mean |     User |   System |
| ---------- | -----------------: | -------: | -------: |
| Bun (Rust) | **209.6 ms ± 6.5** | 228.2 ms | 140.0 ms |
| Bun (Zig)  |     214.5 ms ± 2.5 | 257.7 ms |  96.2 ms |
| Deno       |     241.3 ms ± 5.0 | 207.2 ms |  53.9 ms |
| Node       |    342.5 ms ± 11.2 | 427.8 ms |  59.1 ms |

### Minimal `--help`

| Runtime    |               Mean |     User |   System |
| ---------- | -----------------: | -------: | -------: |
| Bun (Rust) | **239.5 ms ± 3.2** | 240.5 ms | 519.0 ms |
| Bun (Zig)  |     255.4 ms ± 4.8 | 281.1 ms | 551.4 ms |
| Deno       |     261.1 ms ± 4.2 | 220.6 ms |  62.2 ms |
| Node       |     355.4 ms ± 4.0 | 437.3 ms |  64.8 ms |

### `list`

| Runtime    |               Mean |     User |   System |
| ---------- | -----------------: | -------: | -------: |
| Bun (Rust) | **232.7 ms ± 3.7** | 232.3 ms | 510.8 ms |
| Bun (Zig)  |     245.5 ms ± 3.3 | 271.1 ms | 558.7 ms |
| Deno       |     253.8 ms ± 2.7 | 214.0 ms |  63.2 ms |
| Node       |     347.5 ms ± 3.8 | 429.9 ms |  65.1 ms |

### `--list-models`

| Runtime    |               Mean |     User |    System |
| ---------- | -----------------: | -------: | --------: |
| Deno       | **455.4 ms ± 4.7** | 446.2 ms |   89.0 ms |
| Node       |     500.1 ms ± 4.1 | 592.2 ms |   82.7 ms |
| Bun (Zig)  |     606.2 ms ± 8.8 | 751.9 ms | 1256.4 ms |
| Bun (Rust) |     623.8 ms ± 8.6 | 668.0 ms | 1381.5 ms |

## RSS

Mean max RSS via `/usr/bin/time -l`.

| Command          |         Deno |     Node | Bun (Zig) | Bun (Rust) |
| ---------------- | -----------: | -------: | --------: | ---------: |
| `--version`      | **155.8 MB** | 183.7 MB |  204.3 MB |   182.4 MB |
| minimal `--help` | **160.1 MB** | 186.9 MB |  209.0 MB |   185.3 MB |
| `list`           | **157.5 MB** | 186.4 MB |  206.3 MB |   182.0 MB |
| `--list-models`  | **231.2 MB** | 234.8 MB |  379.2 MB |   331.2 MB |

## Summary

- Bun canary was fastest for tiny startup/simple commands.
- Deno won the heavier `--list-models` path.
- Deno had the lowest RAM usage in these runs.
- Bun used much more system CPU time for these workloads.
