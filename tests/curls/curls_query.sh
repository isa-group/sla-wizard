############### BASIC

# Open
curl localhost/open-endpoint?apikey=7B5zIqmRGXmrJTFmKa99-b; echo 
curl localhost/open-endpoint?apikey=QzVV6y1EmQFbbxOfRCwy-b; echo 
curl localhost/open-endpoint?apikey=mGcjH8Fv6U9y3BVF9H3Y-b; echo 
curl -X POST localhost/open-endpoint?apikey=7B5zIqmRGXmrJTFmKa99-b; echo 
curl -X POST localhost/open-endpoint?apikey=QzVV6y1EmQFbbxOfRCwy-b; echo 
curl -X POST localhost/open-endpoint?apikey=mGcjH8Fv6U9y3BVF9H3Y-b; echo 

# Open with parameters
curl localhost/open-endpoint/paramA/paramB?apikey=7B5zIqmRGXmrJTFmKa99-b; echo 
curl localhost/open-endpoint/paramA/paramB?apikey=QzVV6y1EmQFbbxOfRCwy-b; echo 
curl localhost/open-endpoint/paramA/paramB?apikey=mGcjH8Fv6U9y3BVF9H3Y-b; echo 

# 1 per second
curl localhost/pets?apikey=7B5zIqmRGXmrJTFmKa99-b; echo 
curl localhost/pets?apikey=QzVV6y1EmQFbbxOfRCwy-b; echo 
curl localhost/pets?apikey=mGcjH8Fv6U9y3BVF9H3Y-b; echo 

# 2 per minute
curl -X POST localhost/pets?apikey=7B5zIqmRGXmrJTFmKa99-b; echo 
curl -X POST localhost/pets?apikey=QzVV6y1EmQFbbxOfRCwy-b; echo 
curl -X POST localhost/pets?apikey=mGcjH8Fv6U9y3BVF9H3Y-b; echo 

# 3 per second
curl localhost/pets/id01?apikey=7B5zIqmRGXmrJTFmKa99-b; echo 
curl localhost/pets/id01?apikey=QzVV6y1EmQFbbxOfRCwy-b; echo 
curl localhost/pets/id01?apikey=mGcjH8Fv6U9y3BVF9H3Y-b; echo 

# 4 per minute
curl -X PUT localhost/pets/id01?apikey=7B5zIqmRGXmrJTFmKa99-b; echo 
curl -X PUT localhost/pets/id01?apikey=QzVV6y1EmQFbbxOfRCwy-b; echo 
curl -X PUT localhost/pets/id01?apikey=mGcjH8Fv6U9y3BVF9H3Y-b; echo 

# 5 per second
curl -X DELETE localhost/pets/id01?apikey=7B5zIqmRGXmrJTFmKa99-b; echo 
curl -X DELETE localhost/pets/id01?apikey=QzVV6y1EmQFbbxOfRCwy-b; echo 
curl -X DELETE localhost/pets/id01?apikey=mGcjH8Fv6U9y3BVF9H3Y-b; echo 

############### PRO

# Open
curl localhost/open-endpoint?apikey=qmFm7B5zIKa99vcitRGX-p; echo 
curl localhost/open-endpoint?apikey=RCwyJs35QzVV6y1EmQFb-p; echo 
curl localhost/open-endpoint?apikey=H8Fv6UmGcj9y3Bb9TVF9-p; echo 
curl -X POST localhost/open-endpoint?apikey=qmFm7B5zIKa99vcitRGX-p; echo 
curl -X POST localhost/open-endpoint?apikey=RCwyJs35QzVV6y1EmQFb-p; echo 
curl -X POST localhost/open-endpoint?apikey=H8Fv6UmGcj9y3Bb9TVF9-p; echo 

# Open with parameters
curl localhost/open-endpoint/paramA/paramB?apikey=qmFm7B5zIKa99vcitRGX-p; echo 
curl localhost/open-endpoint/paramA/paramB?apikey=RCwyJs35QzVV6y1EmQFb-p; echo 
curl localhost/open-endpoint/paramA/paramB?apikey=H8Fv6UmGcj9y3Bb9TVF9-p; echo 

# 10 per second
curl localhost/pets?apikey=qmFm7B5zIKa99vcitRGX-p; echo 
curl localhost/pets?apikey=RCwyJs35QzVV6y1EmQFb-p; echo 
curl localhost/pets?apikey=H8Fv6UmGcj9y3Bb9TVF9-p; echo 

# 20 per minute
curl -X POST localhost/pets?apikey=qmFm7B5zIKa99vcitRGX-p; echo 
curl -X POST localhost/pets?apikey=RCwyJs35QzVV6y1EmQFb-p; echo 
curl -X POST localhost/pets?apikey=H8Fv6UmGcj9y3Bb9TVF9-p; echo 

# 30 per second
curl localhost/pets/id01?apikey=qmFm7B5zIKa99vcitRGX-p; echo 
curl localhost/pets/id01?apikey=RCwyJs35QzVV6y1EmQFb-p; echo 
curl localhost/pets/id01?apikey=H8Fv6UmGcj9y3Bb9TVF9-p; echo 

# 40 per minute
curl -X PUT localhost/pets/id01?apikey=qmFm7B5zIKa99vcitRGX-p; echo 
curl -X PUT localhost/pets/id01?apikey=RCwyJs35QzVV6y1EmQFb-p; echo 
curl -X PUT localhost/pets/id01?apikey=H8Fv6UmGcj9y3Bb9TVF9-p; echo 

# 50 per second
curl -X DELETE localhost/pets/id01?apikey=qmFm7B5zIKa99vcitRGX-p; echo 
curl -X DELETE localhost/pets/id01?apikey=RCwyJs35QzVV6y1EmQFb-p; echo 
curl -X DELETE localhost/pets/id01?apikey=H8Fv6UmGcj9y3Bb9TVF9-p; echo 