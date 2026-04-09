import { defineConfig } from 'vitepress'

export default defineConfig({
  lang: 'ja',
  title: 'Clade',
  description: 'Claude Code 上に構築されたマルチエージェント開発支援フレームワーク',
  base: '/clade/',

  head: [
    ['meta', { name: 'theme-color', content: '#3451b2' }],
  ],

  themeConfig: {
    logo: null,
    siteTitle: 'Clade',

    nav: [
      { text: 'はじめ方', link: '/getting-started' },
      { text: 'エージェント', link: '/agents' },
      { text: 'ワークフロー', link: '/workflow' },
      { text: 'カスタマイズ', link: '/customization' },
      {
        text: 'v1.7.0',
        items: [
          { text: 'CHANGELOG', link: 'https://github.com/satoh-y-0323/clade/blob/main/CHANGELOG.md' },
          { text: 'GitHub', link: 'https://github.com/satoh-y-0323/clade' },
        ]
      }
    ],

    sidebar: [
      {
        text: 'スタートガイド',
        items: [
          { text: 'Clade とは', link: '/' },
          { text: 'はじめ方', link: '/getting-started' },
        ]
      },
      {
        text: '機能',
        items: [
          { text: 'エージェント一覧', link: '/agents' },
          { text: 'ワークフロー', link: '/workflow' },
          { text: 'セッション管理', link: '/session' },
          { text: '並列開発', link: '/parallel' },
        ]
      },
      {
        text: 'カスタマイズ',
        items: [
          { text: 'カスタマイズガイド', link: '/customization' },
        ]
      },
      {
        text: '非エンジニア向け',
        items: [
          { text: 'ワークフロービルダー', link: '/workflow-builder' },
        ]
      },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/satoh-y-0323/clade' },
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2026 satoh-y-0323',
    },

    editLink: {
      pattern: 'https://github.com/satoh-y-0323/clade/edit/main/docs/:path',
      text: 'GitHub でこのページを編集',
    },

    lastUpdated: {
      text: '最終更新',
    },
  },
})
