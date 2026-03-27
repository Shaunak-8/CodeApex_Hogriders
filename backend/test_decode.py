import sys
sys.path.append("/Users/shaunaksardeshpande/CodeApex_Hogriders/CodeApex_Hogriders/backend/venv/lib/python3.14/site-packages")
from jose import jwt, JWTError

token = "undefined"
secret = "D5VFZ5xDz1GpqYmMIyyiJnQ2hL2doh9655n+Hlwp2W18Ocii1vQvmHxCopdF6cx6056r2n7laWnVBQjDmnJ6Xg=="

try:
    print(jwt.get_unverified_header(token))
except Exception as e:
    print("get_unverified_header Exception:", e)

try:
    jwt.decode(token, secret, algorithms=["HS256"])
except Exception as e:
    print("jwt.decode Exception:", str(e))
