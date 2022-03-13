
export default {
  async fetch(request: Request, env: Env) {
    try {
      return await handleRequest(request, env)
    } catch (e) {
      return new Response(`${e}`)
    }
  },
}

async function handleRequest(request: Request, env: Env) {
  if (request.method === 'POST') {
    //  new gist
    const data = await request.text()
    const id = crypto.randomUUID()
    const deleteKey = crypto.randomUUID()
    await env.GISTS.put(id, data, {metadata: {deleteKey}})
    return new Response(JSON.stringify({id, deleteKey}))
  }

  if (request.method === 'GET') {
    //  retrieve gist
    const url = new URL(request.url)
    const id = url.pathname.slice(1)
    if (id === '') {
      return new Response('bad request', {status: 400})
    }
    const data = await env.GISTS.get(id)
    if (data === null) {
      return new Response('not found', {status: 404})
    }
    return new Response(data)
  }

  if (request.method === 'DELETE') {
  //  delete gist
    //  retrieve gist
    const url = new URL(request.url)
    const [id, deleteKey] = url.pathname.slice(1).split('/')
    const {value, metadata} = await env.GISTS.getWithMetadata<{deleteKey: string}>(id)
    if (value === null) {
      return new Response('not found', {status: 404})
    }
    if (metadata === null || deleteKey !== metadata.deleteKey) {
      return new Response('not authorized', {status: 401})
    }
    await env.GISTS.delete(id)
    return new Response(JSON.stringify({id}))
  }

  return new Response('not allowed', {status: 405})
}

interface Env {
  GISTS: KVNamespace
}
