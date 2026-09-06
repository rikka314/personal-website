import { useParams } from 'react-router-dom'
import BlogHub from './BlogHub'

export default function BlogColumn() {
  const { columnSlug = '' } = useParams()
  return <BlogHub forcedColumnSlug={columnSlug} />
}
