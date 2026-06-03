import { app, events, window as neutralinoWindow } from "@neutralinojs/lib";

export class NeutralinoWindowAdapter {
  public async keepAliveOnClose(): Promise<void> {
    await events.on("windowClose", () => {
      void neutralinoWindow.hide();
    });
  }

  public async show(): Promise<void> {
    await neutralinoWindow.show();
  }

  public async quit(): Promise<void> {
    await app.exit();
  }
}

