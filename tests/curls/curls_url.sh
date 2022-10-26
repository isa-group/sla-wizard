############### BASIC

# Open
curl localhost/open-endpoint/7B5zIqmRGXmrJTFmKa99-b; echo 
curl localhost/open-endpoint/QzVV6y1EmQFbbxOfRCwy-b; echo 
curl localhost/open-endpoint/mGcjH8Fv6U9y3BVF9H3Y-b; echo 
curl -X POST localhost/open-endpoint/7B5zIqmRGXmrJTFmKa99-b; echo 
curl -X POST localhost/open-endpoint/QzVV6y1EmQFbbxOfRCwy-b; echo 
curl -X POST localhost/open-endpoint/mGcjH8Fv6U9y3BVF9H3Y-b; echo 

# Open with parameters
curl localhost/open-endpoint/paramA/paramB/7B5zIqmRGXmrJTFmKa99-b; echo 
curl localhost/open-endpoint/paramA/paramB/QzVV6y1EmQFbbxOfRCwy-b; echo 
curl localhost/open-endpoint/paramA/paramB/mGcjH8Fv6U9y3BVF9H3Y-b; echo 

# 1 per second
curl localhost/pets/7B5zIqmRGXmrJTFmKa99-b; echo 
curl localhost/pets/QzVV6y1EmQFbbxOfRCwy-b; echo 
curl localhost/pets/mGcjH8Fv6U9y3BVF9H3Y-b; echo 

# 2 per minute
curl -X POST localhost/pets/7B5zIqmRGXmrJTFmKa99-b; echo 
curl -X POST localhost/pets/QzVV6y1EmQFbbxOfRCwy-b; echo 
curl -X POST localhost/pets/mGcjH8Fv6U9y3BVF9H3Y-b; echo 

# 3 per second
curl localhost/pets/id01/7B5zIqmRGXmrJTFmKa99-b; echo 
curl localhost/pets/id01/QzVV6y1EmQFbbxOfRCwy-b; echo 
curl localhost/pets/id01/mGcjH8Fv6U9y3BVF9H3Y-b; echo 

# 4 per minute
curl -X PUT localhost/pets/id01/7B5zIqmRGXmrJTFmKa99-b; echo 
curl -X PUT localhost/pets/id01/QzVV6y1EmQFbbxOfRCwy-b; echo 
curl -X PUT localhost/pets/id01/mGcjH8Fv6U9y3BVF9H3Y-b; echo 

# 5 per second
curl -X DELETE localhost/pets/id01/7B5zIqmRGXmrJTFmKa99-b; echo 
curl -X DELETE localhost/pets/id01/QzVV6y1EmQFbbxOfRCwy-b; echo 
curl -X DELETE localhost/pets/id01/mGcjH8Fv6U9y3BVF9H3Y-b; echo 

############### PRO

# Open
curl localhost/open-endpoint/qmFm7B5zIKa99vcitRGX-p; echo 
curl localhost/open-endpoint/RCwyJs35QzVV6y1EmQFb-p; echo 
curl localhost/open-endpoint/H8Fv6UmGcj9y3Bb9TVF9-p; echo 
curl -X POST localhost/open-endpoint/qmFm7B5zIKa99vcitRGX-p; echo 
curl -X POST localhost/open-endpoint/RCwyJs35QzVV6y1EmQFb-p; echo 
curl -X POST localhost/open-endpoint/H8Fv6UmGcj9y3Bb9TVF9-p; echo 

# Open with parameters
curl localhost/open-endpoint/paramA/paramB/qmFm7B5zIKa99vcitRGX-p; echo 
curl localhost/open-endpoint/paramA/paramB/RCwyJs35QzVV6y1EmQFb-p; echo 
curl localhost/open-endpoint/paramA/paramB/H8Fv6UmGcj9y3Bb9TVF9-p; echo 

# 10 per second
curl localhost/pets/qmFm7B5zIKa99vcitRGX-p; echo 
curl localhost/pets/RCwyJs35QzVV6y1EmQFb-p; echo 
curl localhost/pets/H8Fv6UmGcj9y3Bb9TVF9-p; echo 

# 20 per minute
curl -X POST localhost/pets/qmFm7B5zIKa99vcitRGX-p; echo 
curl -X POST localhost/pets/RCwyJs35QzVV6y1EmQFb-p; echo 
curl -X POST localhost/pets/H8Fv6UmGcj9y3Bb9TVF9-p; echo 

# 30 per second
curl localhost/pets/id01/qmFm7B5zIKa99vcitRGX-p; echo 
curl localhost/pets/id01/RCwyJs35QzVV6y1EmQFb-p; echo 
curl localhost/pets/id01/H8Fv6UmGcj9y3Bb9TVF9-p; echo 

# 40 per minute
curl -X PUT localhost/pets/id01/qmFm7B5zIKa99vcitRGX-p; echo 
curl -X PUT localhost/pets/id01/RCwyJs35QzVV6y1EmQFb-p; echo 
curl -X PUT localhost/pets/id01/H8Fv6UmGcj9y3Bb9TVF9-p; echo 

# 50 per second
curl -X DELETE localhost/pets/id01/qmFm7B5zIKa99vcitRGX-p; echo 
curl -X DELETE localhost/pets/id01/RCwyJs35QzVV6y1EmQFb-p; echo 
curl -X DELETE localhost/pets/id01/H8Fv6UmGcj9y3Bb9TVF9-p; echo 