# React Query

## React Query란 무엇인가요?
React Query는 Server State를 관리하는 라이브러리로 React 프로젝트에서 Server와 Client 사이 비동기 로직들을 손쉽게 다루게 해주는 도구입니다.  
현재 저희의 store에는 Client State, Server State 할것 없이 많은 것들을 저장하고 있습니다. (ex. 유저정보, 배너정보, 코인 가격 등...)  
React Query에서 Redux, Mobx 등 기존 상태 관리 라이브러리는 클라이언트 상태 작업에 적합하지만 비동기 또는 서버 상태 작업에는 그다지 좋지 않다고 말하고 있습니다.   

공식 문서에서 Server State 의 특성을 파악할 때 다음과 같은 어려움이 있다고 말합니다.  
- 캐싱 하는것
- 동일한 데이터에 대한 여러 요청을 단일 요청으로 중복 제거하는 것
- 백그라운드에서 "오래된" 데이터를 업데이트 하는 것
- 데이터가 "오래된" 경우를 파악 하는 것
- 데이터 업데이트를 최대한 빨리 반영하는 것
- 페이지네이션 및 Lazy 로딩 데이터와 같은 성능 최적화
- 서버 상태의 메모리 및 가비지 수집 관리
- 구조적 공유를 통한 쿼리 결과를 메모 하는 것

그래서 이러한 문제를 쉽게 해결하고 쉽게 Server State들을 관리하는데 React Query는 선언형으로 사용할 수 있고 커스터마이징이 가능한 최고의 라이브러리라고 소개하고 있습니다.   
고팍스에서의 Server State들은 오래된 입/출금 내역, 오래된 매수/매도 내역, 항상 동일한 랜딩 페이지 팝업 내용, CEO Update, 미디엄 블로그 글? 등 정도가 있을 것 같습니다.  

바로 코드를 한번 보겠습니다.  

```javascript
import { QueryClient, QueryClientProvider, useQuery } from 'react-query'

const queryClient = new QueryClient()

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Example />
    </QueryClientProvider>
  )
}

function Example() {
  const { isLoading, error, data } = useQuery('repoData', () =>
    fetch('https://api.github.com/repos/tannerlinsley/react-query').then(res =>
      res.json()
    )
  )

  if (isLoading) return 'Loading...'

  if (error) return 'An error has occurred: ' + error.message

  return (
    <div>
      <h1>{data.name}</h1>
      <p>{data.description}</p>
      <strong>👀 {data.subscribers_count}</strong>{' '}
      <strong>✨ {data.stargazers_count}</strong>{' '}
      <strong>🍴 {data.forks_count}</strong>
    </div>
  )
}
```
React Query는 내부에 React.context를 사용하고 있기 때문에 QueryClientProvider 로 감싸주어 Global 하게 사용할 수 있도록 합니다.  
실제로 같은 query key를 갖고 있다면 다른 컴포넌트에서 query의 결과를 꺼내올 수 있습니다.    

그럼 React Query는 데이터를 어디에다 캐시를 해둘까요?  
[React Query Github](https://github.com/tannerlinsley/react-query) 를 확인해보면 `QueryCache` 라는 class를 만들어 활용하는데 내부에서 hashMap 형태로 저장하여 활용하는 것을 볼 수 있습니다.  

## React Query의 핵심

React Query 의 핵심 개념에는 3가지가 있습니다.  
- Queries
- Mutations
- Query Invalidation

### Queries
Queries에서는 보통 데이터를 API 요청을 통해 읽어올 때 사용합니다. CRUD의 기능 중 R 입니다.  
useQuery는 `(queryKey, queryFn, options)` 로 parameter를 전달할 수 있게 이루어져 있습니다.  
queryKey 는 유니크한 키 값이고 queryFn 으로 전달한 쿼리 함수가 성공적으로 실행되면 데이터를 반환하고 실패하면 error를 활용할 수 있습니다.  
[userQuery API Reference](https://react-query.tanstack.com/reference/useQuery) 를 보면 굉장히 많은 데이터를 활용할 수 있는것을 볼 수 있습니다.  

- isLoading 또는 status === 'loading' 은 현재 쿼리에 데이터가 없고 가져오는 중이라는 뜻입니다.  
- isError 또는 status === 'error' 은 쿼리에 오류가 발생했다는 것 입니다.  
- isSuccess 또는 status === 'success' - 쿼리가 성공했고 데이터를 활용할 수 있다는 것 입니다.  
- 쿼리가 isError 상태인 경우 error 프로퍼티를 사용할 수 있습니다.  
- 쿼리가 success 상태인 경우 data 프로퍼티를 사용할 수 있습니다.  

useQuery에서 Query key는 다음과 같이 전달할 수도 있습니다.  
```javascript
// An individual todo
useQuery(['todo', 5], ...)
// queryKey === ['todo', 5]

// An individual todo in a "preview" format
useQuery(['todo', 5, { preview: true }], ...)
// queryKey === ['todo', 5, { preview: true }]

// A list of todos that are "done"
useQuery(['todos', { type: 'done' }], ...)
// queryKey === ['todos', { type: 'done' }]
```

Query Key는 해시되기 때문에 다음과 같은 경우에도 모두 같은 것으로 간주합니다.  
```javascript
useQuery(['todos', { status, page }], ...)
useQuery(['todos', { page, status }], ...)
useQuery(['todos', { page, status, other: undefined }], ...)
```

그러나 배열 형태에서는 순서가 중요하기 때문에 아래 3가지 경우는 다른것으로 간주 됩니다.  
```javascript
useQuery(['todos', status, page], ...)
useQuery(['todos', page, status], ...)
useQuery(['todos', undefined, page, status], ...)
```

만약에 여러 API 요청을 해야하는 경우에는 어떻게 해야 할까요? 아래와 같이 useQuery를 필요한 만큼 추가하면 React Query에서 알아서 병렬처리해 동시성을 극대화줍니다.  
```javascript
const usersQuery = useQuery('users', fetchUsers)
const teamsQuery = useQuery('teams', fetchTeams)
const projectsQuery = useQuery('projects', fetchProjects)
```

### Mutations
Mutation에서는 보통 쿼리를 통해 데이터를 생성/업데이트/삭제할 경우 사용하곤 합니다.  
`useMutation` hook 을 사용합니다.  

```javascript
function App() {
  const mutation = useMutation(newTodo => {
    return axios.post('/todos', newTodo)
  })

  return (
    <div>
      {mutation.isLoading ? (
        'Adding todo...'
      ) : (
        <>
          {mutation.isError ? (
            <div>An error occurred: {mutation.error.message}</div>
          ) : null}

          {mutation.isSuccess ? <div>Todo added!</div> : null}

          <button
            onClick={() => {
              mutation.mutate({ id: new Date(), title: 'Do Laundry' })
            }}
          >
            Create Todo
          </button>
        </>
      )}
    </div>
  )
}
```
`isLoading`, `isSuccess`, `isError` 등 Queries를 사용할때와 동일한데 다른점은 mutation 함수에 mutate 를 사용하여 변수나 객체를 전달하여 업데이트 할 수 있습니다.  
[useMutation API Reference](https://react-query.tanstack.com/reference/useMutation) 에도 여러가지 레퍼런스를 확인할 수 있습니다.  
useMutation은 겉보기에는 업데이트 하는것 말고는 하는게 없어보이지만 QueryClient의 invalidateQueries method 와 함께 사용하면 더 시너지를 발휘할 수 있습니다.  

```javascript
import { useMutation, useQueryClient } from 'react-query'
const queryClient = useQueryClient()

// When this mutation succeeds, invalidate any queries with the `todos` or `reminders` query key
const mutation = useMutation(addTodo, {
  onSuccess: () => {
    queryClient.invalidateQueries('todos')
    queryClient.invalidateQueries('reminders')
  },
})
```

mutate 함수가 실행되기 전 성공 여부, 끝과 같이 라이프사이클에 따라 콜백함수를 작성할 수 있스ㅂ니다.
```javascript
useMutation(addSuperHero, {
  onMutate: (variables) => {
    // mutate 함수가 실행되기 전에 실행
    console.log(variables) // addSuperHero에 들어가는 인자
  },
  onSuccess: (data, variables) => {
    // 성공
  },
  onError: (error, variables) => {
    // 에러 발생
  },
  onSettled: (data, error, variables, context) => {
    // 성공 or 실패 상관 없이 실행
  },
})
```

### Query Invalidation  

쿼리를 다시 가져오기 전에 쿼리가 항상 stale 하게 되는 것은 아닙니다. 이를 위해 쿼리를 지능적으로 오래된 것으로, stale 하게 표시하고 잠재적으로 다시 가져올 수 있는 QueryClient 의 invalidateQueries 메소드가 있습니다.

```javascript
// Invalidate every query in the cache
queryClient.invalidateQueries()
// Invalidate every query with a key that starts with `todos`
queryClient.invalidateQueries('todos')
```

위와 같은 방법이 쿼리를 stale 하게, invalidate 하게 만드는 방법입니다. [QueryClient API Reference](https://react-query.tanstack.com/reference/QueryClient) 에도 많은 메소드를 확인할 수 있습니다. 용도에 따라 맞게 사용하면 좋을 것 같습니다.  

이외에도 Infinite scroll 구현시 활용할 수 있는 `useInfinityQuery` 도 있고 굉장히 여러가지 용도로 사용할 수 있는 함수들이 많이 있는 것 같습니다.  




Initial Data Function
이 함수는 쿼리가 초기화될 때 한 번만 실행되어 소중한 메모리 및/또는 CPU를 절약합니다.

function Todos() {
   const result = useQuery('todos', () => fetch('/todos'), {
     initialData: () => {
       return getExpensiveTodos()
     },
   })
 }