const isDevSite = window.location.hostname === 'dev.mokart.fr' ||
    window.location.hostname.startsWith('web-dev-');

export const dashboardUrl = isDevSite
    ? 'https://app-dev.mokart.fr'
    : 'https://app.mokart.fr';
