variable "dev_url" {
  type    = string
  default = "docker://postgres/16/dev"
}

variable "service_url" {
  type    = string
  default = "postgres://training_user:training_pass@localhost:5432/training?sslmode=disable"
}

env "service" {
  src     = "file://schema.sql"
  url     = var.service_url
  dev     = var.dev_url
  schemas = ["training", "public"]
}
