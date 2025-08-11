variable "account_id" { type = string }

resource "cloudflare_r2_bucket" "preview" {
  account_id = var.account_id
  name       = "preview-artifacts"
}
