import requests,random,string,sys
base='http://127.0.0.1:5000'
suffix=''.join(random.choices(string.ascii_lowercase+string.digits,k=6))
username=f'testc{suffix}'
email=f'{username}@example.com'
password='Testpass123'
print('Registering', username)
r=requests.post(base+'/api/auth/register', json={'username':username,'email':email,'password':password,'full_name':'Test Commenter'})
print('register status', r.status_code, r.text)
if r.status_code==201:
    token=r.json().get('access_token')
else:
    rr=requests.post(base+'/api/auth/login', json={'identifier':username,'password':password})
    print('login status', rr.status_code, rr.text)
    if rr.status_code==200:
        token=rr.json().get('access_token')
    else:
        print('Failed to get token, abort')
        sys.exit(1)

headers={'Authorization':f'Bearer {token}','Content-Type':'application/json'}
post_id=7
payload={'post_id':post_id,'content':'Test comment from script'}
print('Posting comment...')
r2=requests.post(base+'/api/comments/', headers=headers, json=payload)
print('post comment status',r2.status_code, r2.text)
