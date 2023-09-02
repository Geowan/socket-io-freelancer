module.exports = {
  apps : [{
    name   : "freelancersocket",
    script : "./index.js",
    max_memory_restart: '300M',
    instances : 1,
    exec_mode : "cluster"
  }]
}
