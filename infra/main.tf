terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"
}

# --- Variables ---

variable "allowed_ssh_cidr" {
  description = "CIDR block allowed to SSH into the instance"
  type        = string
  default     = "0.0.0.0/0"
}

# --- Data Sources ---

data "aws_ami" "al2023" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# --- Key Pair ---

resource "aws_key_pair" "deployer" {
  key_name   = "tic-tac-toe-deployer"
  public_key = file("~/.ssh/id_ed25519.pub")
}

# --- Security Group ---

resource "aws_security_group" "tic_tac_toe" {
  name        = "tic-tac-toe-sg"
  description = "Security group for the tic-tac-toe app server"

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.allowed_ssh_cidr]
    description = "SSH access"
  }

  ingress {
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Tic-tac-toe app"
  }

  ingress {
    from_port   = 3001
    to_port     = 3001
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Grafana UI"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }

  tags = {
    Name = "tic-tac-toe-sg"
  }
}

# --- EC2 Instance ---

resource "aws_instance" "app" {
  ami                    = data.aws_ami.al2023.id
  instance_type          = "t3.micro"
  key_name               = aws_key_pair.deployer.key_name
  vpc_security_group_ids = [aws_security_group.tic_tac_toe.id]

  user_data = <<-EOF
    #!/bin/bash
    dnf update -y
    dnf install -y docker git
    systemctl enable docker
    systemctl start docker
    usermod -aG docker ec2-user

    # Install Docker Compose plugin
    mkdir -p /usr/local/lib/docker/cli-plugins
    curl -SL "https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64" \
      -o /usr/local/lib/docker/cli-plugins/docker-compose
    chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
  EOF

  tags = {
    Name = "tic-tac-toe"
  }
}

# --- Outputs ---

output "public_ip" {
  description = "Public IP of the EC2 instance"
  value       = aws_instance.app.public_ip
}

output "ssh_command" {
  description = "SSH command to connect to the instance"
  value       = "ssh ec2-user@${aws_instance.app.public_ip}"
}

output "app_url" {
  description = "URL to access the tic-tac-toe app"
  value       = "http://${aws_instance.app.public_ip}:3000"
}

output "grafana_url" {
  description = "URL to access the Grafana dashboard"
  value       = "http://${aws_instance.app.public_ip}:3001"
}
