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
    tempCountyId: '廣東行憲臨時選區',
    features: findByNames(['Guangdong']),
  },
  {
    id: 'minnan',
    name: '閩南戰區（廈門・漳州・泉州）',
    tempCountyId: '閩南廈漳泉臨時選區',
    features: findByNames(['Fujian-Minnan']),
  },
  {
    id: 'minbei',
    name: '閩北戰區（福州・寧德・南平）',
    tempCountyId: '閩北福州臨時選區',
    features: findByNames(['Fujian-Minbei']),
  },
  {
    id: 'shanghai_zhejiang',
    name: '上海＋浙江省（杭州・寧波・舟山）',
    tempCountyId: '上海浙江臨時選區',
    features: findByNames(['Shanghai', 'Zhejiang']),
  },
  {
    id: 'nanjing',
    name: '南京戰區（江蘇・南京・安徽）',
    tempCountyId: '南京首都特別選區',
    features: findByNames(['Jiangsu', 'Anhui']),
  },
];
