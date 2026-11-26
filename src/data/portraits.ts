export interface PortraitEntry {
  key: string;
  name: string;
  partyTag: string;
  accentHex: string;
  monogram: string;
  commonsFile: string;
  commonsUrl: string;
}

const fileUrl = (filename: string): string =>
  `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename)}?width=400`;

export const PORTRAITS: Record<string, PortraitEntry> = {
  lu: {
    key: 'lu',
    name: '盧秀燕',
    partyTag: 'KMT · 台中',
    accentHex: '#2563EB',
    monogram: '盧',
    commonsFile: 'Lu Shiow-yen (cropped).jpg',
    commonsUrl: fileUrl('Lu Shiow-yen (cropped).jpg'),
  },
  chiang: {
    key: 'chiang',
    name: '蔣萬安',
    partyTag: 'KMT · 台北',
    accentHex: '#3B82F6',
    monogram: '蔣',
    commonsFile: '蔣萬安市長.jpg',
    commonsUrl: fileUrl('蔣萬安市長.jpg'),
  },
  han: {
    key: 'han',
    name: '韓國瑜',
    partyTag: 'KMT · 國會',
    accentHex: '#1D4ED8',
    monogram: '韓',
    commonsFile: '立法院長韓國瑜.jpg',
    commonsUrl: fileUrl('立法院長韓國瑜.jpg'),
  },
  jaw: {
    key: 'jaw',
    name: '趙少康',
    partyTag: 'KMT · 戰鬥藍',
    accentHex: '#1E40AF',
    monogram: '趙',
    commonsFile: 'Jaw Shaw-kong in 2024 Taiwan presidential election 01 (cropped).jpg',
    commonsUrl: fileUrl('Jaw Shaw-kong in 2024 Taiwan presidential election 01 (cropped).jpg'),
  },
  cheng: {
    key: 'cheng',
    name: '鄭麗文',
    partyTag: 'KMT · 黨中央',
    accentHex: '#2563EB',
    monogram: '鄭',
    commonsFile: '鄭麗文委員.jpg',
    commonsUrl: fileUrl('鄭麗文委員.jpg'),
  },
  fu: {
    key: 'fu',
    name: '傅崐萁',
    partyTag: 'KMT · 花蓮王',
    accentHex: '#1D4ED8',
    monogram: '傅',
    commonsFile: '傅崐萁委員.jpg',
    commonsUrl: fileUrl('傅崐萁委員.jpg'),
  },
  hou: {
    key: 'hou',
    name: '侯友宜',
    partyTag: 'KMT · 新北',
    accentHex: '#2563EB',
    monogram: '侯',
    commonsFile: '侯友宜市長肖像.jpg',
    commonsUrl: fileUrl('侯友宜市長肖像.jpg'),
  },
  chu: {
    key: 'chu',
    name: '朱立倫',
    partyTag: 'KMT · 精算師',
    accentHex: '#1E40AF',
    monogram: '朱',
    commonsFile: 'Eric Chu, New Taipei City 4 million commemoration (cropped).jpg',
    commonsUrl: fileUrl('Eric Chu, New Taipei City 4 million commemoration (cropped).jpg'),
  },
  ma: {
    key: 'ma',
    name: '馬英九',
    partyTag: 'KMT · 1912派',
    accentHex: '#1D4ED8',
    monogram: '馬',
    commonsFile: '中華民國第12、13任總統馬英九先生官方肖像照.jpg',
    commonsUrl: fileUrl('中華民國第12、13任總統馬英九先生官方肖像照.jpg'),
  },
  lai: {
    key: 'lai',
    name: '賴清德',
    partyTag: 'DPP · 總統府',
    accentHex: '#16A34A',
    monogram: '賴',
    commonsFile: '賴清德總統 (cropped 2).jpg',
    commonsUrl: fileUrl('賴清德總統 (cropped 2).jpg'),
  },
  hsiao: {
    key: 'hsiao',
    name: '蕭美琴',
    partyTag: 'DPP · 副手',
    accentHex: '#15803D',
    monogram: '蕭',
    commonsFile: '蕭美琴副總統.jpg',
    commonsUrl: fileUrl('蕭美琴副總統.jpg'),
  },
  huang: {
    key: 'huang',
    name: '黃國昌',
    partyTag: 'TPP · 立院',
    accentHex: '#06B6D4',
    monogram: '昌',
    commonsFile: '立法委員黃國昌.jpg',
    commonsUrl: fileUrl('立法委員黃國昌.jpg'),
  },
  ko: {
    key: 'ko',
    name: '柯文哲',
    partyTag: 'TPP · 創黨',
    accentHex: '#0891B2',
    monogram: '柯',
    commonsFile: '柯文哲主席.jpg',
    commonsUrl: fileUrl('柯文哲主席.jpg'),
  },
};
