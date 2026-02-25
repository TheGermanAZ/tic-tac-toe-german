terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 6.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = "us-central1"
  zone    = "us-central1-a"
}

# --- Variables ---

variable "project_id" {
  description = "GCP project ID to deploy into"
  type        = string
}

variable "allowed_ssh_cidr" {
  description = "CIDR block allowed to SSH into the instance"
  type        = string
  default     = "0.0.0.0/0"
}

# --- Firewall Rules ---

resource "google_compute_firewall" "tic_tac_toe_ssh" {
  name    = "tic-tac-toe-ssh"
  network = "default"

  allow {
    protocol = "tcp"
    ports    = ["22"]
  }

  source_ranges = [var.allowed_ssh_cidr]
  target_tags   = ["tic-tac-toe"]
}

resource "google_compute_firewall" "tic_tac_toe_app" {
  name    = "tic-tac-toe-app"
  network = "default"

  allow {
    protocol = "tcp"
    ports    = ["3000", "3001"]
  }

  source_ranges = ["0.0.0.0/0"]
  target_tags   = ["tic-tac-toe"]
}

# --- Compute Instance ---

resource "google_compute_instance" "app" {
  name         = "tic-tac-toe"
  machine_type = "e2-micro"

  tags = ["tic-tac-toe"]

  boot_disk {
    initialize_params {
      image = "debian-cloud/debian-12"
      size  = 20
    }
  }

  network_interface {
    network = "default"

    access_config {
      # Ephemeral public IP — fine for dev
    }
  }

  metadata_startup_script = <<-EOF
    #!/bin/bash
    apt-get update -y
    apt-get install -y docker.io docker-compose-v2 git
    systemctl enable docker
    systemctl start docker
    usermod -aG docker $(whoami)
  EOF

  metadata = {
    enable-oslogin = "TRUE"
  }
}

# --- Outputs ---

output "public_ip" {
  description = "Public IP of the GCE instance"
  value       = google_compute_instance.app.network_interface[0].access_config[0].nat_ip
}

output "ssh_command" {
  description = "SSH command to connect via gcloud"
  value       = "gcloud compute ssh tic-tac-toe --zone=us-central1-a --project=${var.project_id}"
}

output "app_url" {
  description = "URL to access the tic-tac-toe app"
  value       = "http://${google_compute_instance.app.network_interface[0].access_config[0].nat_ip}:3000"
}

output "grafana_url" {
  description = "URL to access the Grafana dashboard"
  value       = "http://${google_compute_instance.app.network_interface[0].access_config[0].nat_ip}:3001"
}
