import { type Writable, writable } from "svelte/store";

function createNotificationStore() {
    const { subscribe, update }: Writable<BarNotification[]> = writable([])

    return {
        subscribe,
        push: (notification: BarNotification) => {
            update((arr) => {
                arr.push(notification)
                if (notification.timeout > 0) {
                setTimeout(() => {
                        notifications.remove(notification)
                    }, notification.timeout)
                }
                return arr
            })
        },
        remove: (notification: BarNotification) => {
            update((arr) => {
                const notificationIndex = arr.findIndex(elem => elem == notification)
                arr.splice(notificationIndex, 1)
                return arr
            })
        }
    }
}

export const notifications = createNotificationStore()

export type BarNotification = {
    type: NotificationType.CUSTOM,
    content: string,
    timeout: number,
    color: string
} | {
    type: Exclude<NotificationType, NotificationType.CUSTOM>,
    timeout: number,
    content: string
}

export enum NotificationType {
    ERROR,
    WARNING,
    INFO,
    SUCCESS,
    CUSTOM
}