// Cursor: React-Leaflet를 사용해서
// props로 받은 lat, lng, title을 기반으로
// MapContainer(zoom=13), TileLayer(OpenStreetMap), Marker+Popup(title) 렌더링하는
// Tailwind 스타일의 Map 컴포넌트를 작성해 줘.
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import React from 'react'

// 기본 마커 아이콘 설정 (Leaflet 기본 마커가 제대로 보이도록)
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
})

type MapProps = {
  lat: number
  lng: number
  title: string
}

export default function Map({ lat, lng, title }: MapProps) {
  return (
    <div className="w-full h-72 rounded-lg overflow-hidden shadow mb-4">
      <MapContainer center={[lat, lng]} zoom={13} scrollWheelZoom={false} className="w-full h-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[lat, lng]}>
          <Popup>{title}</Popup>
        </Marker>
      </MapContainer>
    </div>
  )
} 