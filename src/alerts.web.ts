import type { AlertButton } from 'react-native';
export const Alert = {
  alert(title: string, message?: string, buttons?: AlertButton[]) {
    const text = [title, message].filter(Boolean).join('\n\n');
    if (buttons && buttons.length > 1) {
      const accepted = window.confirm(text);
      const action = accepted ? buttons.find(button => button.style !== 'cancel') : buttons.find(button => button.style === 'cancel');
      action?.onPress?.();
    } else {
      window.alert(text);
      buttons?.[0]?.onPress?.();
    }
  },
};
