import requests

base='http://127.0.0.1:5000'

# Register a temp user (idempotent for test)
r = requests.post(base+'/api/auth/register', json={'username':'testuser1','email':'test1@example.com','password':'Testpass123','full_name':'Tester'})
print('register', r.status_code, r.text)

token = None
if r.ok:
    token = r.json().get('access_token')
else:
    # Try login if user exists
    if r.status_code == 409:
        l = requests.post(base+'/api/auth/login', json={'identifier':'testuser1','password':'Testpass123'})
        print('login', l.status_code, l.text)
        if l.ok:
            token = l.json().get('access_token')

if token:
    # Ensure there's at least one post to comment on
    posts = requests.get(base+'/api/posts')
    print('get posts', posts.status_code)
    if posts.ok and posts.json().get('posts'):
        post_id = posts.json()['posts'][0]['id']
    else:
        # create post as fallback
        p = requests.post(base+'/api/posts', headers={'Authorization':f'Bearer {token}'}, json={'title':'Temp Post','content':'Temp content','author_id':1})
        print('create post', p.status_code, p.text)
        post_id = p.json()['post']['id'] if p.ok else 1

    # Post comment
    c = requests.post(base+'/api/comments/', headers={'Authorization':f'Bearer {token}'}, json={'post_id':post_id,'content':'Test comment from script'})
    print('post comment', c.status_code, c.text)
    # Verify comment appears in listing
    g = requests.get(f"{base}/api/comments/post/{post_id}")
    print('get comments', g.status_code)
    if g.ok:
        print('comments count:', len(g.json().get('comments', [])))
else:
    print('register/login failed, cannot continue')
