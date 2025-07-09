import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface SlackMessage {
  text: string;
  channel?: string;
  username?: string;
  icon_emoji?: string;
  attachments?: Array<{
    color: string;
    title: string;
    text: string;
    fields?: Array<{
      title: string;
      value: string;
      short: boolean;
    }>;
    footer?: string;
    ts?: number;
  }>;
}

@Injectable()
export class SlackNotificationService {
  private readonly logger = new Logger(SlackNotificationService.name);
  private readonly webhookUrl: string;
  private readonly defaultChannel: string;

  constructor(private configService: ConfigService) {
    this.webhookUrl = this.configService.get<string>('SLACK_WEBHOOK_URL');
    this.defaultChannel = this.configService.get<string>('SLACK_DEFAULT_CHANNEL', '#inflnara-alerts');
  }

  async sendMessage(message: SlackMessage): Promise<void> {
    if (!this.webhookUrl) {
      this.logger.warn('Slack webhook URL not configured, skipping notification');
      return;
    }

    try {
      const payload = {
        channel: message.channel || this.defaultChannel,
        username: message.username || 'Inflnara Bot',
        icon_emoji: message.icon_emoji || ':robot_face:',
        text: message.text,
        attachments: message.attachments || [],
      };

      await axios.post(this.webhookUrl, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000,
      });

      this.logger.log(`Slack notification sent to ${payload.channel}`);
    } catch (error) {
      this.logger.error('Failed to send Slack notification', error.stack);
    }
  }

  async sendCampaignApprovalRequest(campaignId: string, campaignName: string, advertiserName: string): Promise<void> {
    const message: SlackMessage = {
      text: '새로운 캠페인 승인 요청이 있습니다!',
      icon_emoji: ':mega:',
      attachments: [
        {
          color: '#36a64f',
          title: '캠페인 승인 요청',
          text: `캠페인 "${campaignName}"이 승인 대기 상태입니다.`,
          fields: [
            {
              title: '캠페인 ID',
              value: campaignId,
              short: true,
            },
            {
              title: '광고주',
              value: advertiserName,
              short: true,
            },
          ],
          footer: 'Inflnara Platform',
          ts: Math.floor(Date.now() / 1000),
        },
      ],
    };

    await this.sendMessage(message);
  }

  async sendErrorAlert(error: Error, context: string): Promise<void> {
    const message: SlackMessage = {
      text: '시스템 오류가 발생했습니다!',
      icon_emoji: ':warning:',
      attachments: [
        {
          color: '#ff0000',
          title: '오류 알림',
          text: error.message,
          fields: [
            {
              title: '컨텍스트',
              value: context,
              short: true,
            },
            {
              title: '스택 트레이스',
              value: error.stack?.substring(0, 500) + '...' || '스택 트레이스 없음',
              short: false,
            },
          ],
          footer: 'Inflnara Platform',
          ts: Math.floor(Date.now() / 1000),
        },
      ],
    };

    await this.sendMessage(message);
  }

  async sendSettlementCompleted(settlementId: string, amount: number, influencerName: string): Promise<void> {
    const message: SlackMessage = {
      text: '정산이 완료되었습니다!',
      icon_emoji: ':money_with_wings:',
      attachments: [
        {
          color: '#00ff00',
          title: '정산 완료',
          text: `인플루언서 "${influencerName}"의 정산이 완료되었습니다.`,
          fields: [
            {
              title: '정산 ID',
              value: settlementId,
              short: true,
            },
            {
              title: '정산 금액',
              value: `${amount.toLocaleString()}원`,
              short: true,
            },
          ],
          footer: 'Inflnara Platform',
          ts: Math.floor(Date.now() / 1000),
        },
      ],
    };

    await this.sendMessage(message);
  }

  async sendSystemHealthAlert(service: string, status: string, details?: string): Promise<void> {
    const color = status === 'healthy' ? '#00ff00' : '#ff0000';
    const emoji = status === 'healthy' ? ':white_check_mark:' : ':x:';

    const message: SlackMessage = {
      text: `시스템 상태 알림: ${service}`,
      icon_emoji: emoji,
      attachments: [
        {
          color,
          title: '시스템 상태',
          text: `${service} 서비스가 ${status} 상태입니다.`,
          fields: details ? [
            {
              title: '상세 정보',
              value: details,
              short: false,
            },
          ] : [],
          footer: 'Inflnara Platform',
          ts: Math.floor(Date.now() / 1000),
        },
      ],
    };

    await this.sendMessage(message);
  }

  async sendUserRegistration(userId: string, userEmail: string, role: string): Promise<void> {
    const message: SlackMessage = {
      text: '새로운 사용자가 등록되었습니다!',
      icon_emoji: ':new:',
      attachments: [
        {
          color: '#0099ff',
          title: '사용자 등록',
          text: `새로운 ${role} 사용자가 등록되었습니다.`,
          fields: [
            {
              title: '사용자 ID',
              value: userId,
              short: true,
            },
            {
              title: '이메일',
              value: userEmail,
              short: true,
            },
            {
              title: '역할',
              value: role,
              short: true,
            },
          ],
          footer: 'Inflnara Platform',
          ts: Math.floor(Date.now() / 1000),
        },
      ],
    };

    await this.sendMessage(message);
  }
} 