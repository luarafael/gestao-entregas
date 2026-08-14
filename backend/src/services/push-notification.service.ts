import webpush from 'web-push'
import { env } from '../config/env.js'
import { pushSubscriptionRepository } from '../repositories/push-subscription.repository.js'
import { usuarioRepository } from '../repositories/usuario.repository.js'
import { formatDateOnlyBR, formatTimeBR } from '../utils/date.utils.js'

export interface PushNotificationPayload {
  title: string
  body: string
  url?: string
  tag?: string
}

let vapidConfigured = false

function ensureVapidConfigured(): boolean {
  if (vapidConfigured) {
    return true
  }

  if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY) {
    return false
  }

  webpush.setVapidDetails(
    env.VAPID_SUBJECT,
    env.VAPID_PUBLIC_KEY,
    env.VAPID_PRIVATE_KEY,
  )
  vapidConfigured = true
  return true
}

export function isPushConfigured(): boolean {
  return Boolean(env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY)
}

async function sendToUserIds(
  userIds: string[],
  payload: PushNotificationPayload,
): Promise<void> {
  if (!ensureVapidConfigured() || userIds.length === 0) {
    return
  }

  const subscriptions = await pushSubscriptionRepository.findByUserIds(userIds)
  if (subscriptions.length === 0) {
    return
  }

  const body = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url ?? '/',
    tag: payload.tag ?? payload.title,
  })

  await Promise.all(
    subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
          },
          body,
          {
            TTL: 60 * 60 * 24,
            urgency: 'high',
          },
        )
      } catch (error) {
        const statusCode =
          error &&
          typeof error === 'object' &&
          'statusCode' in error &&
          typeof error.statusCode === 'number'
            ? error.statusCode
            : null

        if (statusCode === 404 || statusCode === 410) {
          await pushSubscriptionRepository.deleteById(subscription.id)
          return
        }

        console.error('Falha ao enviar web push', {
          subscriptionId: subscription.id,
          statusCode,
          title: payload.title,
        })
      }
    }),
  )
}

async function sendToAdmins(payload: PushNotificationPayload): Promise<void> {
  const adminIds = await usuarioRepository.findActiveAdminIds()
  await sendToUserIds(adminIds, payload)
}

export class PushNotificationService {
  /** Toda notificação de usuário deve passar daqui para chegar na tela do celular. */
  notifyMotoboyNewRoute(
    motoboyId: string,
    data: { rotaId: string; totalParadas: number; enderecoInicial: string },
  ) {
    void sendToUserIds([motoboyId], {
      title: 'Nova rota planejada',
      body: `${data.totalParadas} entrega(s) · Partida: ${data.enderecoInicial}`,
      url: '/planejador',
      tag: `route-${data.rotaId}`,
    })
  }

  notifyAdminsNewApproval(data: {
    prestacaoId: string
    motoboyNome: string
    data: Date | string
  }) {
    void sendToAdmins({
      title: 'Nova solicitação de aprovação',
      body: `${data.motoboyNome} enviou prestação de ${formatDateOnlyBR(data.data)}`,
      url: '/aprovacoes',
      tag: `approval-${data.prestacaoId}`,
    })
  }

  notifyMotoboyPrestacaoApproved(motoboyId: string, data: Date | string) {
    void sendToUserIds([motoboyId], {
      title: 'Prestação aprovada',
      body: `Sua prestação de ${formatDateOnlyBR(data)} foi aprovada.`,
      url: '/minha-prestacao',
      tag: `prestacao-approved-${formatDateOnlyBR(data)}`,
    })
  }

  notifyMotoboyPrestacaoRejected(
    motoboyId: string,
    data: { data: Date | string; motivoRejeicao?: string | null },
  ) {
    const dataLabel = formatDateOnlyBR(data.data)
    const motivo = data.motivoRejeicao?.trim()
    void sendToUserIds([motoboyId], {
      title: 'Prestação rejeitada',
      body: motivo
        ? `Prestação de ${dataLabel} rejeitada: ${motivo}`
        : `Sua prestação de ${dataLabel} foi rejeitada.`,
      url: '/minha-prestacao',
      tag: `prestacao-rejected-${dataLabel}`,
    })
  }

  notifyAdminsNewPendencia(data: {
    pendenciaId: string
    motoboyNome: string
    descricao: string
    criadoEm: Date
  }) {
    void sendToAdmins({
      title: 'Nova pendência do motoboy',
      body: `${data.motoboyNome} registrou pendência: ${data.descricao} · ${formatTimeBR(data.criadoEm)}`,
      url: '/pendencias',
      tag: `pendencia-${data.pendenciaId}`,
    })
  }

  notifyAdminsDeliveryCompleted(data: {
    execucaoId: string
    motoboyNome: string
    cliente: string
    dataHoraStatus: Date
  }) {
    void sendToAdmins({
      title: 'Entrega concluída',
      body: `${data.motoboyNome} concluiu entrega: ${data.cliente} · ${formatTimeBR(data.dataHoraStatus)}`,
      url: '/monitoramento',
      tag: `delivery-${data.execucaoId}`,
    })
  }

  notifyAdminsRouteCompleted(data: {
    rotaId: string
    motoboyNome: string
    totalParadas: number
    concluidaEm: Date
  }) {
    void sendToAdmins({
      title: 'Rota concluída',
      body: `${data.motoboyNome} concluiu a rota: ${data.totalParadas} entrega(s) · ${formatTimeBR(data.concluidaEm)}`,
      url: '/monitoramento',
      tag: `route-completed-${data.rotaId}`,
    })
  }
}

export const pushNotificationService = new PushNotificationService()
