terraform {
  required_version = ">= 1.6.0"
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }
}

provider "cloudflare" {
  # Set CLOUDFLARE_API_TOKEN env var
}

# Placeholder: base zone and wildcard DNS for preview
variable "zone_id" { type = string }
variable "preview_subdomain" { type = string }

resource "cloudflare_record" "preview_wildcard" {
  zone_id = var.zone_id
  name    = "*.preview"
  type    = "CNAME"
  value   = var.preview_subdomain
  proxied = true
}
