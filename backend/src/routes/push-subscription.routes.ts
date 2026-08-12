import { Router } from 'express'
import {
  asyncHandler,
  validateBody,
} from '../middleware/index.js'
import {
  pushSubscriptionSchema,
  pushUnsubscribeSchema,
} from '../schemas/push-subscription.schema.js'
import { pushSubscriptionService } from '../services/push-subscription.service.js'

export const pushSubscriptionRoutes = Router()

pushSubscriptionRoutes.get(
  '/config',
  asyncHandler(async (_req, res) => {
    res.json(pushSubscriptionService.getConfig())
  }),
)

pushSubscriptionRoutes.post(
  '/subscribe',
  validateBody(pushSubscriptionSchema),
  asyncHandler(async (req, res) => {
    const subscription = await pushSubscriptionService.subscribe(
      req.user!,
      req.body,
    )
    res.status(201).json(subscription)
  }),
)

pushSubscriptionRoutes.delete(
  '/subscribe',
  validateBody(pushUnsubscribeSchema),
  asyncHandler(async (req, res) => {
    await pushSubscriptionService.unsubscribe(req.user!, req.body)
    res.status(204).send()
  }),
)
