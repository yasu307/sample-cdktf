import { Construct } from 'constructs';
import { App, TerraformStack, Token } from 'cdktf';
import * as path from 'path';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { Eip } from '@cdktf/provider-aws/lib/eip';
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { SecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule';
import { Alb } from '@cdktf/provider-aws/lib/alb';
import { AlbTargetGroup } from '@cdktf/provider-aws/lib/alb-target-group';
import { AlbListener } from '@cdktf/provider-aws/lib/alb-listener';
import { AlbListenerRule } from '@cdktf/provider-aws/lib/alb-listener-rule';
import { EcsCluster } from '@cdktf/provider-aws/lib/ecs-cluster';
import { EcrRepository } from '@cdktf/provider-aws/lib/ecr-repository';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { EcsTaskDefinition } from '@cdktf/provider-aws/lib/ecs-task-definition';
import { EcsService } from '@cdktf/provider-aws/lib/ecs-service';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketObject } from '@cdktf/provider-aws/lib/s3-bucket-object';
import { LambdaFunction } from '@cdktf/provider-aws/lib/lambda-function';
import { SnsTopic } from '@cdktf/provider-aws/lib/sns-topic';
import { SnsTopicSubscription } from '@cdktf/provider-aws/lib/sns-topic-subscription';
import { SnsTopicPolicy } from '@cdktf/provider-aws/lib/sns-topic-policy';
import { LambdaPermission } from '@cdktf/provider-aws/lib/lambda-permission';
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { CloudwatchEventRule } from '@cdktf/provider-aws/lib/cloudwatch-event-rule';
import { CloudwatchEventTarget } from '@cdktf/provider-aws/lib/cloudwatch-event-target';
import { KinesisFirehoseDeliveryStream } from '@cdktf/provider-aws/lib/kinesis-firehose-delivery-stream';
import { ElasticsearchDomain } from '@cdktf/provider-aws/lib/elasticsearch-domain';

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
        egressOnlyGatewayId:    '',
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
        egressOnlyGatewayId:    '',
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
      healthCheck: {
        interval: 30,
        path: '/ping',
        port: 'traffic-port',
        protocol: 'HTTP',
        timeout: 5,
        unhealthyThreshold: 2,
      },
      dependsOn: [alb]
    });

    const albListener = new AlbListener(this, 'sample-cdktf-alb-listener', {
      loadBalancerArn: Token.asString(alb.arn),
      port:            80,
      protocol:        'HTTP',
      defaultAction: [{
        type: 'fixed-response',
        fixedResponse: {
          contentType: 'text/plain',
          messageBody: 'OK',
          statusCode:  '200'
        }
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
        pathPattern: {
          values: ['*']
        }
      }]
    });

    const ecsCluster = new EcsCluster(this, 'sample-cdktf-cluster', {
      name: 'sample-cdktf-cluster'
    });

    const ecrRepository = new EcrRepository(this, 'sample-cdktf-repository', {
      name: 'project/ecr-for-aws-deploy'
    });

    const fluentBitEcr = new EcrRepository(this, 'sample-cdktf-fluentbit-repository', {
      name: 'project/fluentbit'
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
              "s3:GetObjectVersion",
              "firehose:PutRecordBatch"
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
          "logDriver":"awsfirelens",
				  "options": {
            "Name": "firehose",
            "region": "ap-northeast-1",
            "delivery_stream": "sample-cdktf-firehose"
				  }
        }
      },
      {
        "essential": true,
        "image": "${fluentBitEcr.repositoryUrl}:0.0.1",
        "name": "log_router",
        "firelensConfiguration": {
          "type": "fluentbit",
          "options": {
            "config-file-type": "file",
            "config-file-value": "/fluent-bit/etc/extra.conf"
          }
        },
        "logConfiguration": {
          "logDriver": "awslogs",
          "options": {
            "awslogs-group": "/aws/ecs/firelens-container",
            "awslogs-region": "ap-northeast-1",
            "awslogs-create-group": "true",
            "awslogs-stream-prefix": "firelens"
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
      networkConfiguration: {
        securityGroups: [Token.asString(vpc.defaultSecurityGroupId)],
        subnets: [Token.asString(privateSubnet1.id), Token.asString(privateSubnet2.id)]
      },
      loadBalancer: [{
        containerName:  'sample-cdktf-container',
        containerPort:  9000,
        targetGroupArn: albTargetGroup.arn
      }]
    });

    const s3Bucket = new S3Bucket(this, 'sample-cdktf-s3', {
      bucket: 'sample-cdktf-s3'
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
      runtime:      'nodejs14.x',
      s3Bucket:     s3Bucket.bucket,
      s3Key:        s3BucketObject.key,
      timeout:      30,
      environment: {
        variables: {
          ['SLACK_API_TOKEN']: 'xoxb-xxxxxxxxxxxxx',
          ['SLACK_CHANNEL']:   'xxxxxxxx'
        }
      }
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

    new CloudwatchLogGroup(this, 'sample-cdktf-firelens-container-log-group', {
      name: `/aws/ecs/firelens-container`
    });

    const firehoseRole = new IamRole(this, 'firehoseRole', {
      name: 'sample-cdktf-firehoseRole',
      assumeRolePolicy: `{
        "Version":   "2012-10-17",
        "Statement": [
          {
            "Action": "sts:AssumeRole",
            "Principal": {
              "Service": [
                "firehose.amazonaws.com"
              ]
            },
            "Effect": "Allow",
            "Sid":    ""
          }
        ]
      }`
    });

    const firehoseIamPolicy = new IamPolicy(this, 'sample-cdktf-firehose-iam-policy', {
      name: 'sample-cdktf-firehose-iam-policy',
      description: 'IAM policy for firehose',
      policy: `{
        "Version":   "2012-10-17",
        "Statement": [
          {
            "Action": [
              "es:DescribeElasticsearchDomain",
              "es:DescribeElasticsearchDomains",
              "es:DescribeElasticsearchDomainConfig",
              "es:ESHttpPost",
              "es:ESHttpPut",
              "es:ESHttpGet",
              "logs:PutLogEvents",
              "s3:AbortMultipartUpload",
              "s3:GetBucketLocation",
              "s3:GetObject",
              "s3:ListBucket",
              "s3:ListBucketMultipartUploads",
              "s3:PutObject"
            ],
            "Resource": [
              "*"
            ],
            "Effect": "Allow"
          }
        ]
      }`
    });

    new IamRolePolicyAttachment(this, 'attach-firehose-policy', {
      role: firehoseRole.name,
      policyArn: firehoseIamPolicy.arn
    });

    const firehoseS3Bucket = new S3Bucket(this, 'sample-cdktf-firehose-s3', {
      bucket: 'sample-cdktf-firehose-s3'
    });


    const elasticsearchDomain = new ElasticsearchDomain(this, 'sample-cdktf-es-domain', {
      domainName: 'sample-cdktf-es-domain',
      elasticsearchVersion: '7.10',
      clusterConfig: {
        instanceType: 't3.medium.elasticsearch'
      },
      ebsOptions: {
        ebsEnabled: true,
        volumeType: "gp3",
        volumeSize: 10,
        throughput: 125
      },
      accessPolicies: `
        {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Action": "es:*",
              "Principal": "*",
              "Effect": "Allow",
              "Resource": "*",
              "Condition": {
                "IpAddress": { "aws:SourceIp": ["124.34.207.19"] }
              }
            }
          ]
        }`
    });

    new KinesisFirehoseDeliveryStream(this, 'sample-cdktf-firehose', {
      name: 'sample-cdktf-firehose',
      destination: 'opensearch',
      opensearchConfiguration: {
        domainArn: elasticsearchDomain.arn,
        roleArn: firehoseRole.arn,
        indexName: 'sample-cdktf',
        s3Configuration: {
          roleArn: firehoseRole.arn,
          bucketArn: firehoseS3Bucket.arn,
          bufferingSize: 10,
          bufferingInterval: 400
        }
      },
    });
  }
}

const app = new App();
new MyStack(app, 'sample-cdktf');
app.synth();
