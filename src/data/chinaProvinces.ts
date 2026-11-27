import type { Feature, FeatureCollection, Geometry } from 'geojson';
import chinaProvincesGeoRaw from './chinaProvincesGeo.json';

export type ChinaProvinceId =
  | 'guangdong'
  | 'minnan'
  | 'minbei'
  | 'shanghai_zhejiang'
  | 'nanjing';

export interface ChinaProvinceProps {
  name: string;
  name_zh: string;
}

export interface ChinaProvinceTheaterDef {
  id: ChinaProvinceId;
  name: string;
  tempCountyId: string;
  features: Feature<Geometry, ChinaProvinceProps>[];
}

const rawCollection = chinaProvincesGeoRaw as unknown as FeatureCollection<
  Geometry,
  ChinaProvinceProps
>;

export const ALL_CHINA_PROVINCES: Feature<Geometry, ChinaProvinceProps>[] =
  rawCollection.features;

const findByNames = (names: string[]): Feature<Geometry, ChinaProvinceProps>[] =>
  ALL_CHINA_PROVINCES.filter((f) => names.includes(f.properties.name));

export const CHINA_PROVINCE_THEATERS: ChinaProvinceTheaterDef[] = [
  {
    id: 'guangdong',
    name: '廣東省（廣州・深圳・湛江）',
    tempCountyId: '華南行憲臨時選區',
    features: findByNames(['Guangdong']),
  },
  {
    id: 'minnan',
    name: '閩南戰區（廈門・漳州・泉州）',
    tempCountyId: '華南行憲臨時選區',
    features: findByNames(['Fujian-Minnan']),
  },
  {
    id: 'minbei',
    name: '閩北戰區（福州・寧德・南平）',
    tempCountyId: '華南行憲臨時選區',
    features: findByNames(['Fujian-Minbei']),
  },
  {
    id: 'shanghai_zhejiang',
    name: '上海＋浙江省（杭州・寧波・舟山）',
    tempCountyId: '華中行憲臨時選區',
    features: findByNames(['Shanghai', 'Zhejiang']),
  },
  {
    id: 'nanjing',
    name: '南京戰區（江蘇・南京・安徽）',
    tempCountyId: '華中行憲臨時選區',
    features: findByNames(['Jiangsu', 'Anhui']),
  },
];

export interface MacroMainlandRegionDef {
  id: 'huanan' | 'huazhong' | 'huabei' | 'dongbei' | 'xibu';
  name: string;
  tempCountyId: string;
  features: Feature<Geometry, ChinaProvinceProps>[];
}

export const MACRO_MAINLAND_REGIONS: MacroMainlandRegionDef[] = [
  {
    id: 'huanan',
    name: '華南地區（閩粵桂黔滇瓊 · 金馬併入福建）',
    tempCountyId: '華南行憲臨時選區',
    features: findByNames([
      'Guangdong',
      'Guangxi',
      'Hainan',
      'Guizhou',
      'Yunnan',
      'Fujian-Minnan',
      'Fujian-Minbei',
    ]),
  },
  {
    id: 'huazhong',
    name: '華中地區（還都南京・蘇浙皖贛鄂湘川渝滬）',
    tempCountyId: '華中行憲臨時選區',
    features: findByNames([
      'Zhejiang',
      'Shanghai',
      'Jiangsu',
      'Anhui',
      'Jiangxi',
      'Hunan',
      'Hubei',
      'Sichuan',
      'Chongqing',
    ]),
  },
  {
    id: 'huabei',
    name: '華北地區（平津冀魯晉豫陝甘）',
    tempCountyId: '華北行憲臨時選區',
    features: findByNames(['Shandong', 'Henan', 'Hebei', 'Beijing', 'Tianjin', 'Shanxi', 'Shaanxi']),
  },
  {
    id: 'dongbei',
    name: '東北地區（東北九省：遼安遼北吉松合黑嫩興）',
    tempCountyId: '東北行憲臨時選區',
    features: findByNames(['Liaoning']),
  },
];
