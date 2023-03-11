############### BASIC

# Open
curl -s localhost/open-endpoint?apikey=7B5zIqmRGXmrJTFmKa99-b; echo 
curl -s localhost/open-endpoint?apikey=QzVV6y1EmQFbbxOfRCwy-b; echo 
curl -s localhost/open-endpoint?apikey=mGcjH8Fv6U9y3BVF9H3Y-b; echo 
curl -s -X POST localhost/open-endpoint?apikey=7B5zIqmRGXmrJTFmKa99-b; echo 
curl -s -X POST localhost/open-endpoint?apikey=QzVV6y1EmQFbbxOfRCwy-b; echo 
curl -s -X POST localhost/open-endpoint?apikey=mGcjH8Fv6U9y3BVF9H3Y-b; echo 

# Open with parameters
curl -s localhost/open-endpoint/paramA/paramB?apikey=7B5zIqmRGXmrJTFmKa99-b; echo 
curl -s localhost/open-endpoint/paramA/paramB?apikey=QzVV6y1EmQFbbxOfRCwy-b; echo 
curl -s localhost/open-endpoint/paramA/paramB?apikey=mGcjH8Fv6U9y3BVF9H3Y-b; echo 

# 1 per second
curl -s localhost/pets?apikey=7B5zIqmRGXmrJTFmKa99-b; echo 
curl -s localhost/pets?apikey=QzVV6y1EmQFbbxOfRCwy-b; echo 
curl -s localhost/pets?apikey=mGcjH8Fv6U9y3BVF9H3Y-b; echo 

# 2 per minute
curl -s -X POST localhost/pets?apikey=7B5zIqmRGXmrJTFmKa99-b; echo 
curl -s -X POST localhost/pets?apikey=QzVV6y1EmQFbbxOfRCwy-b; echo 
curl -s -X POST localhost/pets?apikey=mGcjH8Fv6U9y3BVF9H3Y-b; echo 

# 3 per second
curl -s localhost/pets/id01?apikey=7B5zIqmRGXmrJTFmKa99-b; echo 
curl -s localhost/pets/id01?apikey=QzVV6y1EmQFbbxOfRCwy-b; echo 
curl -s localhost/pets/id01?apikey=mGcjH8Fv6U9y3BVF9H3Y-b; echo 

# 4 per minute
curl -s -X PUT localhost/pets/id01?apikey=7B5zIqmRGXmrJTFmKa99-b; echo 
curl -s -X PUT localhost/pets/id01?apikey=QzVV6y1EmQFbbxOfRCwy-b; echo 
curl -s -X PUT localhost/pets/id01?apikey=mGcjH8Fv6U9y3BVF9H3Y-b; echo 

# 5 per second
curl -s -X DELETE localhost/pets/id01?apikey=7B5zIqmRGXmrJTFmKa99-b; echo 
curl -s -X DELETE localhost/pets/id01?apikey=QzVV6y1EmQFbbxOfRCwy-b; echo 
curl -s -X DELETE localhost/pets/id01?apikey=mGcjH8Fv6U9y3BVF9H3Y-b; echo 

############### PRO

# Open
curl -s localhost/open-endpoint?apikey=qmFm7B5zIKa99vcitRGX-p; echo 
curl -s localhost/open-endpoint?apikey=RCwyJs35QzVV6y1EmQFb-p; echo 
curl -s localhost/open-endpoint?apikey=H8Fv6UmGcj9y3Bb9TVF9-p; echo 
curl -s -X POST localhost/open-endpoint?apikey=qmFm7B5zIKa99vcitRGX-p; echo 
curl -s -X POST localhost/open-endpoint?apikey=RCwyJs35QzVV6y1EmQFb-p; echo 
curl -s -X POST localhost/open-endpoint?apikey=H8Fv6UmGcj9y3Bb9TVF9-p; echo 

# Open with parameters
curl -s localhost/open-endpoint/paramA/paramB?apikey=qmFm7B5zIKa99vcitRGX-p; echo 
curl -s localhost/open-endpoint/paramA/paramB?apikey=RCwyJs35QzVV6y1EmQFb-p; echo 
curl -s localhost/open-endpoint/paramA/paramB?apikey=H8Fv6UmGcj9y3Bb9TVF9-p; echo 

# 10 per second
curl -s localhost/pets?apikey=qmFm7B5zIKa99vcitRGX-p; echo 
curl -s localhost/pets?apikey=RCwyJs35QzVV6y1EmQFb-p; echo 
curl -s localhost/pets?apikey=H8Fv6UmGcj9y3Bb9TVF9-p; echo 

# 20 per minute
curl -s -X POST localhost/pets?apikey=qmFm7B5zIKa99vcitRGX-p; echo 
curl -s -X POST localhost/pets?apikey=RCwyJs35QzVV6y1EmQFb-p; echo 
curl -s -X POST localhost/pets?apikey=H8Fv6UmGcj9y3Bb9TVF9-p; echo 

# 30 per second
curl -s localhost/pets/id01?apikey=qmFm7B5zIKa99vcitRGX-p; echo 
curl -s localhost/pets/id01?apikey=RCwyJs35QzVV6y1EmQFb-p; echo 
curl -s localhost/pets/id01?apikey=H8Fv6UmGcj9y3Bb9TVF9-p; echo 

# 40 per minute
curl -s -X PUT localhost/pets/id01?apikey=qmFm7B5zIKa99vcitRGX-p; echo 
curl -s -X PUT localhost/pets/id01?apikey=RCwyJs35QzVV6y1EmQFb-p; echo 
curl -s -X PUT localhost/pets/id01?apikey=H8Fv6UmGcj9y3Bb9TVF9-p; echo 

# 50 per second
curl -s -X DELETE localhost/pets/id01?apikey=qmFm7B5zIKa99vcitRGX-p; echo 
curl -s -X DELETE localhost/pets/id01?apikey=RCwyJs35QzVV6y1EmQFb-p; echo 
curl -s -X DELETE localhost/pets/id01?apikey=H8Fv6UmGcj9y3Bb9TVF9-p; echo 