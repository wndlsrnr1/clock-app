export interface SelectedNotificationSound {
  fileName: string;
  source: string;
}

export interface NotificationSoundFilePort {
  chooseCustomMp3(): Promise<SelectedNotificationSound | null>;
}
