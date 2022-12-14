import { Construct } from 'constructs';
import { App, TerraformStack, Token } from 'cdktf';
import { 
  AwsProvider,
  Vpc,
  Subnet,
  InternetGateway,
  NatGateway, 
  Eip,
  RouteTable,
  RouteTableAssociation,
  SecurityGroup,
  SecurityGroupRule,
  Alb,
  AlbTargetGroup,
  AlbListener,
  AlbListenerRule,
  EcsCluster,
  EcrRepository,
  IamRole,
  IamPolicy,
  IamRolePolicyAttachment,
  EcsTaskDefinition,
  EcsService,
  S3Bucket,
  S3BucketObject,
  LambdaFunction,
  SnsTopic,
  SnsTopicSubscription,
  SnsTopicPolicy,
  LambdaPermission,
  CloudwatchLogGroup,
  CloudwatchEventRule,
  CloudwatchEventTarget
} from './.gen/providers/aws';

import * as path from 'path';

class MyStack extends TerraformStack {
  constructor(scope: Construct, name: string) {
    super(scope, name);

    // define resources here
    new AwsProvider(this, 'sample-cdktf', {
      region: 'ap-northeast-1'
    });

    const vpc = new Vpc(this, 'sample-cdktf-vpc', {
      cidrBlock:          '10.0.0.0/16',
      enableDnsHostnames: true,
      tags:               { ['Name']: 'sample-cdktf production' }
    });

    /** Public Subnet */
    const publicSubnet1 = new Subnet(this, 'sample-cdktf-public-subnet1', {
      vpcId:               Token.asString(vpc.id),
      availabilityZone:    'ap-northeast-1a',
      cidrBlock:           '10.0.0.0/20',
      mapPublicIpOnLaunch: true,
      tags:                { ['Name']: 'Public1 AZ1a sample-cdktf' }
    });

    const publicSubnet2 = new Subnet(this, 'sample-cdktf-public-subnet2', {
      vpcId:               Token.asString(vpc.id),
      availabilityZone:    'ap-northeast-1c',
      cidrBlock:           '10.0.16.0/20',
      mapPublicIpOnLaunch: true,
      tags:                { ['Name']: 'Public2 AZ1c sample-cdktf' }
    });
    /** Private Subnet */
    const privateSubnet1 = new Subnet(this, 'sample-cdktf-private-subnet1', {
      vpcId:               Token.asString(vpc.id),
      availabilityZone:    'ap-northeast-1a',
      cidrBlock:           '10.0.128.0/20',
      mapPublicIpOnLaunch: true,
      tags:                { ['Name']: 'Private1 AZ1a sample-cdktf' }
    });

    const privateSubnet2 = new Subnet(this, 'sample-cdktf-private-subnet2', {
      vpcId:               Token.asString(vpc.id),
      availabilityZone:    'ap-northeast-1c',
      cidrBlock:           '10.0.144.0/20',
      mapPublicIpOnLaunch: true,
      tags:                { ['Name']: 'Private2 AZ1c sample-cdktf' }
    });

    const internetGateway = new InternetGateway(this, 'sample-cdktf-igw-production', {
      vpcId: Token.asString(vpc.id),
      tags:  { ['Name']: 'igw-production sample-cdktf' }
    });

    const eip = new Eip(this, 'sample-cdktf-eip', {
      vpc: true
    });

    const natGateway = new NatGateway(this, 'sample-cdktf-nat-gateway', {
      allocationId: Token.asString(eip.id),
      subnetId:     Token.asString(publicSubnet1.id),
      tags:         { ['Name']: 'sample-cdktf nat-gateway-production' }
    });

    const publicRouteTable = new RouteTable(this, 'sample-cdktf-public-rtb', {
      vpcId: Token.asString(vpc.id),
      route: [{
        cidrBlock:              '0.0.0.0/0',
        gatewayId:              Token.asString(internetGateway.id),
        ipv6CidrBlock:          '',
        egressOnlyGatewayId:    '',
        instanceId:             '',
        natGatewayId:           '',
        networkInterfaceId:     '',
        transitGatewayId:       '',
        vpcPeeringConnectionId: ''
      }],
      tags: { ['Name']: 'sample-cdktf Public rtb' }
    });

    const privateRouteTable = new RouteTable(this, 'sample-cdktf-private-rtb', {
      vpcId: Token.asString(vpc.id),
      route: [{
        cidrBlock:              '0.0.0.0/0',
        gatewayId:              '',
        ipv6CidrBlock:          '',
        egressOnlyGatewayId:    '',
        instanceId:             '',
        natGatewayId:           Token.asString(natGateway.id),
        networkInterfaceId:     '',
        transitGatewayId:       '',
        vpcPeeringConnectionId: ''
      }],
      tags: { ['Name']: 'sample-cdktf Private rtb' }
    });

    new RouteTableAssociation(this, 'sample-cdktf-public-rtb1', {
      routeTableId: Token.asString(publicRouteTable.id),
      subnetId:     Token.asString(publicSubnet1.id)
    });

    /** Association to Public RouteTable */
    new RouteTableAssociation(this, 'sample-cdktf-public-rtb-association1', {
      routeTableId: Token.asString(publicRouteTable.id),
      subnetId: Token.asString(publicSubnet1.id)
    });
    new RouteTableAssociation(this, 'sample-cdktf-public-rtb-association2', {
      routeTableId: Token.asString(publicRouteTable.id),
      subnetId: Token.asString(publicSubnet2.id)
    });

    /** Association to Private RouteTable */
    new RouteTableAssociation(this, 'sample-cdktf-private-rtb-association1', {
      routeTableId: Token.asString(privateRouteTable.id),
      subnetId:     Token.asString(privateSubnet1.id)
    });
    new RouteTableAssociation(this, 'sample-cdktf-private-rtb-association2', {
      routeTableId: Token.asString(privateRouteTable.id),
      subnetId:     Token.asString(privateSubnet2.id)
    });

    const security = new SecurityGroup(this, 'sample-cdktf-security-group', {
      name:  'sample-cdktf',
      vpcId: Token.asString(vpc.id),
      tags:  { ['Name']: 'sample-cdktf' }
    });

    new SecurityGroupRule(this, 'sample-cdktf-security-ingress', {
      cidrBlocks:      ['0.0.0.0/0'],
      fromPort:        80,
      protocol:        'tcp',
      securityGroupId: Token.asString(security.id),
      toPort:          80,
      type:            'ingress'
    });
    new SecurityGroupRule(this, 'sample-cdktf-security-egress', {
      cidrBlocks:      ['0.0.0.0/0'],
      fromPort:        0,
      protocol:        'all',
      securityGroupId: Token.asString(security.id),
      toPort:          0,
      type:            'egress'
    });


    const alb = new Alb(this, 'sample-cdktf-alb', {
      name:                     'sample-cdktf-alb',
      internal:                 false,
      loadBalancerType:         'application',
      securityGroups:           [Token.asString(security.id), Token.asString(vpc.defaultSecurityGroupId)],
      subnets:                  [Token.asString(publicSubnet1.id), Token.asString(publicSubnet2.id)],
      ipAddressType:            'ipv4',
      enableDeletionProtection: false
    });

    const albTargetGroup = new AlbTargetGroup(this, 'sample-cdktf-alb-target-group', {
      name:       'sample-cdktf-alb-target-group',
      port:       80,
      protocol:   'HTTP',
      targetType: 'ip',
      vpcId:      Token.asString(vpc.id),
      healthCheck: [{
        interval: 30,
        path: '/',
        port: 'traffic-port',
        protocol: 'HTTP',
        timeout: 5,
        unhealthyThreshold: 2
      }],
      dependsOn: [alb]
    });

    const albListener = new AlbListener(this, 'sample-cdktf-alb-listener', {
      loadBalancerArn: Token.asString(alb.arn),
      port:            80,
      protocol:        'HTTP',
      defaultAction: [{
        type: 'fixed-response',
        fixedResponse: [{
          contentType: 'text/plain',
          messageBody: 'OK',
          statusCode:  '200'
        }]
      }]
    });

    new AlbListenerRule(this, 'sample-cdktf-alb-listener-rule', {
      listenerArn: albListener.arn,
      priority:    100,
      action: [{
        type: 'forward',
        targetGroupArn: albTargetGroup.arn
      }],
      condition: [{
        field: 'path-pattern',
        values: ['*']
      }]
    });

    const ecsCluster = new EcsCluster(this, 'sample-cdktf-cluster', {
      name: 'sample-cdktf-cluster'
    });

    const ecrRepository = new EcrRepository(this, 'sample-cdktf-repository', {
      name: 'project/sample-ecr'
    });

    const ecsTaskRole = new IamRole(this, 'ecsTaskRole', {
      name: 'sample-cdktf-ecsTaskRole',
      assumeRolePolicy: `{
        "Version": "2012-10-17",
        "Statement": [
          {
            "Action": "sts:AssumeRole",
            "Principal": {
              "Service": "ecs-tasks.amazonaws.com"
          },
          "Effect": "Allow",
          "Sid": ""
          }
        ]
      }`
    });

    const ecsTaskIamPolicy = new IamPolicy(this, 'ecs-task-policy', {
      name:        'ecs-task-policy',
      description: 'Policy for updating ECS tasks',
      policy: `{
        "Version":   "2012-10-17",
        "Statement": [
          {
            "Action": [
              "ecs:DescribeServices",
              "ecs:CreateTaskSet",
              "ecs:UpdateServicePrimaryTaskSet",
              "ecs:DeleteTaskSet",
              "elasticloadbalancing:DescribeTargetGroups",
              "elasticloadbalancing:DescribeListeners",
              "elasticloadbalancing:ModifyListener",
              "elasticloadbalancing:DescribeRules",
              "elasticloadbalancing:ModifyRule",
              "lambda:InvokeFunction",
              "cloudwatch:DescribeAlarms",
              "sns:Publish",
              "s3:GetObject",
              "s3:GetObjectVersion"
            ],
            "Resource": [
              "*"
            ],
            "Effect": "Allow"
          }
        ]
      }`
    });

    new IamRolePolicyAttachment(this, 'attach-ecs-task-policy', {
      role:      ecsTaskRole.name,
      policyArn: ecsTaskIamPolicy.arn
    });

    const ecsTaskExecutionRole = new IamRole(this, 'ecsTaskExecutionRole', {
      name: 'sample-cdktf-ecsTaskExecutionRole',
      assumeRolePolicy: `{
        "Version":   "2012-10-17",
        "Statement": [
          {
            "Action":    "sts:AssumeRole",
            "Principal": {
              "Service": "ecs-tasks.amazonaws.com"
            },
            "Effect": "Allow",
            "Sid":    ""
          }
        ]
      }`
    });

    const ecsTaskExecutionIamPolicy = new IamPolicy(this, 'ecs-task-execution-policy', {
      name:        'ecs-task-execution-policy',
      description: 'Policy for updating ECS tasks',
      policy: `{
        "Version":   "2012-10-17",
        "Statement": [
          {
            "Action": [
              "ecr:GetAuthorizationToken",
              "ecr:BatchCheckLayerAvailability",
              "ecr:GetDownloadUrlForLayer",
              "ecr:BatchGetImage",
              "logs:CreateLogStream",
              "logs:PutLogEvents"
            ],
            "Resource": [
              "*"
            ],
            "Effect": "Allow"
          }
        ]
      }`
    });

    new IamRolePolicyAttachment(this, 'attach-ecs-task-execution-policy', {
      role:      ecsTaskExecutionRole.name,
      policyArn: ecsTaskExecutionIamPolicy.arn
    });

    const containerDefinition: string = `[
      {
        "essential":    true,
        "name":         "sample-cdktf-container",
        "image":        "${ecrRepository.repositoryUrl}:latest",
        "portMappings": [
          {
            "hostPort":      9000,
            "protocol":      "tcp",
            "containerPort": 9000
          }
        ],
        "logConfiguration": {
          "logDriver": "awslogs",
          "options": {
            "awslogs-group":         "/aws/ecs/task-for-cdktf",
            "awslogs-stream-prefix": "ecs",
            "awslogs-region":        "ap-northeast-1"
          }
        }
      }
    ]`

    const ecsTaskDefinition = new EcsTaskDefinition(this, 'sample-cdktf-task', {
      containerDefinitions:    containerDefinition,
      family:                  'task-for-cdktf',
      networkMode:             'awsvpc',
      executionRoleArn:        ecsTaskExecutionRole.arn,
      taskRoleArn:             ecsTaskRole.arn,
      cpu:                     '512',
      memory:                  '1024',
      requiresCompatibilities: ['FARGATE']
    });

    new EcsService(this, 'sample-cdktf-ecs-service', {
      cluster:                         Token.asString(ecsCluster.id),
      deploymentMaximumPercent:        200,
      deploymentMinimumHealthyPercent: 100,
      desiredCount:                    1,
      launchType:                      'FARGATE',
      name:                            'sample-cdktf-ecs-service',
      platformVersion:                 'LATEST',
      taskDefinition:                  Token.asString(ecsTaskDefinition.id),
      networkConfiguration: [{
        securityGroups: [Token.asString(vpc.defaultSecurityGroupId)],
        subnets: [Token.asString(privateSubnet1.id), Token.asString(privateSubnet2.id)]
      }],
      loadBalancer: [{
        containerName:  'sample-cdktf-container',
        containerPort:  9000,
        targetGroupArn: albTargetGroup.arn
      }]
    });

    const s3Bucket = new S3Bucket(this, 'sample-cdktf-s3', {
      bucket: 'sample-cdktf-s3',
      region: 'ap-northeast-1'
    });

    const s3BucketObject = new S3BucketObject(this, 'notification-to-Slack-dist.zip', {
      bucket:      s3Bucket.bucket,
      key:         'notification-to-Slack-dist.zip',
      contentType: 'zip',
      source:      path.resolve('./notification-to-Slack/notification-to-Slack-dist/notification-to-Slack-dist.zip')
    });

    const lambdaExecutionRole = new IamRole(this, 'lambdaExecutionRole', {
      name: 'sample-cdktf-lambdaExecutionRole',
      assumeRolePolicy: `{
        "Version":   "2012-10-17",
        "Statement": [
          {
            "Action": "sts:AssumeRole",
            "Principal": {
              "Service": [
                "lambda.amazonaws.com",
                "ecs-tasks.amazonaws.com"
              ]
            },
            "Effect": "Allow",
            "Sid":    ""
          }
        ]
      }`
    });

    const lambdaExecutionIamPolicy = new IamPolicy(this, 'lambda-logging', {
      name:        'sample-cdktf-lambda-logging',
      description: 'IAM policy for logging from a lambda',
      policy: `{
        "Version":   "2012-10-17",
        "Statement": [
          {
            "Action": [
              "iam:PassRole",
              "ecs:RegisterTaskDefinition",
              "ecs:UpdateService",
              "logs:CreateLogGroup",
              "logs:CreateLogStream",
              "logs:PutLogEvents"
            ],
            "Resource": [
              "arn:aws:logs:*:*:*",
              "arn:aws:ecs:*:*:*",
              "${ecsTaskExecutionRole.arn}"
            ],
            "Effect": "Allow"
          }
        ]
      }`,
      dependsOn: [ecsTaskExecutionRole]
    });

    new IamRolePolicyAttachment(this, 'attach-lambda-policy', {
      role:      lambdaExecutionRole.name,
      policyArn: lambdaExecutionIamPolicy.arn
    });

    const notificationToSlack = new LambdaFunction(this, 'Sample-Lambda-Notification-to-Slack', {
      functionName: 'Sample-Lambda-Notification-to-Slack',
      handler:      'index.handler',
      role:         lambdaExecutionRole.arn,
      runtime:      'nodejs12.x',
      s3Bucket:     s3Bucket.bucket,
      s3Key:        s3BucketObject.key,
      timeout:      30,
      environment: [{
        variables: {
          ['SLACK_API_TOKEN']: 'xoxb-xxxxxxxxxxxxx',
          ['SLACK_CHANNEL']:   'xxxxxxxx'
        }
      }]
    });

    const snsTopic = new SnsTopic(this, 'sample-cdktf-sns', {
      name: 'sample-cdktf-sns'
    });

    new SnsTopicSubscription(this, 'sample-cdktf-sns-subscription', {
      endpoint: notificationToSlack.arn,
      protocol: 'lambda',
      topicArn: snsTopic.arn
    });

    new SnsTopicPolicy(this, 'sample-cdktf-sns-policy', {
      arn: snsTopic.arn,
      policy: `{
        "Version":   "2012-10-17",
        "Statement": {
          "Effect": "Allow",
          "Sid":    "",
          "Principal": {
            "Service": "events.amazonaws.com"
          },
          "Action": [
            "SNS:Publish"
          ],
          "Resource": [
            "*"
          ]
        }
      }`
    });

    new LambdaPermission(this, 'permission-to-sns', {
      action:       'lambda:InvokeFunction',
      functionName: notificationToSlack.functionName,
      principal:    'sns.amazonaws.com',
      sourceArn:    snsTopic.arn,
      statementId:  'AllowExecutionFromSNS'
    });

    new CloudwatchLogGroup(this, 'sample-cdktf-notification-to-slack-log-group', {
      name: `/aws/lambda/${notificationToSlack.functionName}`
    });

    new CloudwatchLogGroup(this, 'sample-cdktf-ecs-task-log-group', {
      name: `/aws/ecs/${ecsTaskDefinition.family}`
    });

    const eventRule = new CloudwatchEventRule(this, 'sample-cdktf-event-rule', {
      name:        'capture-ecr-update',
      description: 'Capture each AWS ECR Update',
      eventPattern: `{
        "source":      ["aws.ecr"],
        "detail-type": ["ECR Image Action"],
        "detail": {
          "action-type": ["PUSH"],
          "result":      ["SUCCESS"]
        }
      }`
    });

    new CloudwatchEventTarget(this, 'sample-cdktf-event-target', {
      arn:      snsTopic.arn,
      rule:     eventRule.name,
      targetId: 'SendToSNS'
    });
  }
}

const app = new App();
new MyStack(app, 'sample-cdktf');
app.synth();
