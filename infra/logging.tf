// CloudWatch Log Groups for centralized logging and retention policies
resource "aws_cloudwatch_log_group" "aureva_rewards_info" {
  name              = "/aureva-rewards/info"
  retention_in_days = 30
}

resource "aws_cloudwatch_log_group" "aureva_rewards_error" {
  name              = "/aureva-rewards/error"
  retention_in_days = 90
}
