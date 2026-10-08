import DesignScreen from './design/DesignScreen'
export default function FeatureScreen({path}:Readonly<{path:'/dream'|'/astro'|'/chat'|'/history'|'/settings'}>) {
  return <DesignScreen path={path}/>
}
