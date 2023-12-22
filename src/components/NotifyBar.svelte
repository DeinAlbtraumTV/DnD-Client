<script>
    import { NotificationType, notifications } from "../stores/notificationStore";


</script>

<div>
    {#each $notifications as notification, i}
        {#if i < 3}
            <div class="notification-bar {NotificationType[notification.type].toLowerCase()}" style="{notification.type == NotificationType.CUSTOM ? `background-color: ${notification.color}` : ""}">
                <span>{notification.content}</span>
            </div>
        {/if}
    {/each}
</div>

<style>
    .notification-bar {
        width: 100%;
        height: 2.25rem;
        border-radius: 5px;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .notification-bar.success {
        background-color: #0fb100;
    }

    .notification-bar.info {
        background-color: #00bbbb;
    }

    .notification-bar.warning {
        background-color: #dd8500;
    }

    .notification-bar.error {
        background-color: #b80000;
    }
</style>