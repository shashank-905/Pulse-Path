import BengaluruMap from './BengaluruMap'

// Different map (Carto) in front — live GPS object + directions from backend (Google when key set)
export default function MapSelector(props) {
  return <BengaluruMap {...props} />
}
