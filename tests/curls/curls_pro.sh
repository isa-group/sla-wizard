##### HEADER

# 10 per second
curl -H "apikey: qmFm7B5zIKa99vcitRGX-p" localhost/pets
curl -H "apikey: RCwyJs35QzVV6y1EmQFb-p" localhost/pets
curl -H "apikey: H8Fv6UmGcj9y3Bb9TVF9-p" localhost/pets

# 20 per minute
curl -X POST -H "apikey: qmFm7B5zIKa99vcitRGX-p" localhost/pets
curl -X POST -H "apikey: RCwyJs35QzVV6y1EmQFb-p" localhost/pets
curl -X POST -H "apikey: H8Fv6UmGcj9y3Bb9TVF9-p" localhost/pets

# 30 per second
curl -H "apikey: qmFm7B5zIKa99vcitRGX-p" localhost/pets/id01
curl -H "apikey: RCwyJs35QzVV6y1EmQFb-p" localhost/pets/id01
curl -H "apikey: H8Fv6UmGcj9y3Bb9TVF9-p" localhost/pets/id01

# 40 per minute
curl -X PUT -H "apikey: qmFm7B5zIKa99vcitRGX-p" localhost/pets/id01
curl -X PUT -H "apikey: RCwyJs35QzVV6y1EmQFb-p" localhost/pets/id01
curl -X PUT -H "apikey: H8Fv6UmGcj9y3Bb9TVF9-p" localhost/pets/id01

# 50 per second
curl -X DELETE -H "apikey: qmFm7B5zIKa99vcitRGX-p" localhost/pets/id01
curl -X DELETE -H "apikey: RCwyJs35QzVV6y1EmQFb-p" localhost/pets/id01
curl -X DELETE -H "apikey: H8Fv6UmGcj9y3Bb9TVF9-p" localhost/pets/id01

#####################################################################

##### QUERY

# 10 per second
curl localhost/pets?apikey=qmFm7B5zIKa99vcitRGX-p
curl localhost/pets?apikey=RCwyJs35QzVV6y1EmQFb-p
curl localhost/pets?apikey=H8Fv6UmGcj9y3Bb9TVF9-p

# 20 per minute
curl -X POST localhost/pets?apikey=qmFm7B5zIKa99vcitRGX-p
curl -X POST localhost/pets?apikey=RCwyJs35QzVV6y1EmQFb-p
curl -X POST localhost/pets?apikey=H8Fv6UmGcj9y3Bb9TVF9-p

# 30 per second
curl localhost/pets/id01?apikey=qmFm7B5zIKa99vcitRGX-p
curl localhost/pets/id01?apikey=RCwyJs35QzVV6y1EmQFb-p
curl localhost/pets/id01?apikey=H8Fv6UmGcj9y3Bb9TVF9-p

# 40 per minute
curl -X PUT localhost/pets/id01?apikey=qmFm7B5zIKa99vcitRGX-p
curl -X PUT localhost/pets/id01?apikey=RCwyJs35QzVV6y1EmQFb-p
curl -X PUT localhost/pets/id01?apikey=H8Fv6UmGcj9y3Bb9TVF9-p

# 50 per second
curl -X DELETE localhost/pets/id01?apikey=qmFm7B5zIKa99vcitRGX-p
curl -X DELETE localhost/pets/id01?apikey=RCwyJs35QzVV6y1EmQFb-p
curl -X DELETE localhost/pets/id01?apikey=H8Fv6UmGcj9y3Bb9TVF9-p

#####################################################################

##### URL

# 10 per second
curl localhost/pets/qmFm7B5zIKa99vcitRGX-p
curl localhost/pets/RCwyJs35QzVV6y1EmQFb-p
curl localhost/pets/H8Fv6UmGcj9y3Bb9TVF9-p

# 20 per minute
curl -X POST localhost/pets/qmFm7B5zIKa99vcitRGX-p
curl -X POST localhost/pets/RCwyJs35QzVV6y1EmQFb-p
curl -X POST localhost/pets/H8Fv6UmGcj9y3Bb9TVF9-p

# 30 per second
curl localhost/pets/id01/qmFm7B5zIKa99vcitRGX-p
curl localhost/pets/id01/RCwyJs35QzVV6y1EmQFb-p
curl localhost/pets/id01/H8Fv6UmGcj9y3Bb9TVF9-p

# 40 per minute
curl -X PUT localhost/pets/id01/qmFm7B5zIKa99vcitRGX-p
curl -X PUT localhost/pets/id01/RCwyJs35QzVV6y1EmQFb-p
curl -X PUT localhost/pets/id01/H8Fv6UmGcj9y3Bb9TVF9-p

# 50 per second
curl -X DELETE localhost/pets/id01/qmFm7B5zIKa99vcitRGX-p
curl -X DELETE localhost/pets/id01/RCwyJs35QzVV6y1EmQFb-p
curl -X DELETE localhost/pets/id01/H8Fv6UmGcj9y3Bb9TVF9-p