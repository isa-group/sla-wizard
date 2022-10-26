############### BASIC

# Open
curl -H "apikey: 7B5zIqmRGXmrJTFmKa99-b" localhost/open-endpoint; echo 
curl -H "apikey: QzVV6y1EmQFbbxOfRCwy-b" localhost/open-endpoint; echo 
curl -H "apikey: mGcjH8Fv6U9y3BVF9H3Y-b" localhost/open-endpoint; echo 
curl -X POST -H "apikey: 7B5zIqmRGXmrJTFmKa99-b" localhost/open-endpoint; echo 
curl -X POST -H "apikey: QzVV6y1EmQFbbxOfRCwy-b" localhost/open-endpoint; echo 
curl -X POST -H "apikey: mGcjH8Fv6U9y3BVF9H3Y-b" localhost/open-endpoint; echo 

# Open with parameters
curl -H "apikey: 7B5zIqmRGXmrJTFmKa99-b" localhost/open-endpoint/paramA/paramB; echo 
curl -H "apikey: QzVV6y1EmQFbbxOfRCwy-b" localhost/open-endpoint/paramA/paramB; echo 
curl -H "apikey: mGcjH8Fv6U9y3BVF9H3Y-b" localhost/open-endpoint/paramA/paramB; echo 

# 1 per second
curl -H "apikey: 7B5zIqmRGXmrJTFmKa99-b" localhost/pets; echo 
curl -H "apikey: QzVV6y1EmQFbbxOfRCwy-b" localhost/pets; echo 
curl -H "apikey: mGcjH8Fv6U9y3BVF9H3Y-b" localhost/pets; echo 

# 2 per minute
curl -X POST -H "apikey: 7B5zIqmRGXmrJTFmKa99-b" localhost/pets; echo 
curl -X POST -H "apikey: QzVV6y1EmQFbbxOfRCwy-b" localhost/pets; echo 
curl -X POST -H "apikey: mGcjH8Fv6U9y3BVF9H3Y-b" localhost/pets; echo 

# 3 per second
curl -H "apikey: 7B5zIqmRGXmrJTFmKa99-b" localhost/pets/id01; echo 
curl -H "apikey: QzVV6y1EmQFbbxOfRCwy-b" localhost/pets/id01; echo 
curl -H "apikey: mGcjH8Fv6U9y3BVF9H3Y-b" localhost/pets/id01; echo 

# 4 per minute
curl -X PUT -H "apikey: 7B5zIqmRGXmrJTFmKa99-b" localhost/pets/id01; echo 
curl -X PUT -H "apikey: QzVV6y1EmQFbbxOfRCwy-b" localhost/pets/id01; echo 
curl -X PUT -H "apikey: mGcjH8Fv6U9y3BVF9H3Y-b" localhost/pets/id01; echo 

# 5 per second
curl -X DELETE -H "apikey: 7B5zIqmRGXmrJTFmKa99-b" localhost/pets/id01; echo 
curl -X DELETE -H "apikey: QzVV6y1EmQFbbxOfRCwy-b" localhost/pets/id01; echo 
curl -X DELETE -H "apikey: mGcjH8Fv6U9y3BVF9H3Y-b" localhost/pets/id01; echo 

############### PRO

# Open
curl -H "apikey: qmFm7B5zIKa99vcitRGX-p" localhost/open-endpoint; echo 
curl -H "apikey: RCwyJs35QzVV6y1EmQFb-p" localhost/open-endpoint; echo 
curl -H "apikey: H8Fv6UmGcj9y3Bb9TVF9-p" localhost/open-endpoint; echo 
curl -X POST -H "apikey: qmFm7B5zIKa99vcitRGX-p" localhost/open-endpoint; echo 
curl -X POST -H "apikey: RCwyJs35QzVV6y1EmQFb-p" localhost/open-endpoint; echo 
curl -X POST -H "apikey: H8Fv6UmGcj9y3Bb9TVF9-p" localhost/open-endpoint; echo 

# Open with parameters
curl -H "apikey: qmFm7B5zIKa99vcitRGX-p" localhost/open-endpoint/paramA/paramB; echo 
curl -H "apikey: RCwyJs35QzVV6y1EmQFb-p" localhost/open-endpoint/paramA/paramB; echo 
curl -H "apikey: H8Fv6UmGcj9y3Bb9TVF9-p" localhost/open-endpoint/paramA/paramB; echo 

# 10 per second
curl -H "apikey: qmFm7B5zIKa99vcitRGX-p" localhost/pets; echo 
curl -H "apikey: RCwyJs35QzVV6y1EmQFb-p" localhost/pets; echo 
curl -H "apikey: H8Fv6UmGcj9y3Bb9TVF9-p" localhost/pets; echo 

# 20 per minute
curl -X POST -H "apikey: qmFm7B5zIKa99vcitRGX-p" localhost/pets; echo 
curl -X POST -H "apikey: RCwyJs35QzVV6y1EmQFb-p" localhost/pets; echo 
curl -X POST -H "apikey: H8Fv6UmGcj9y3Bb9TVF9-p" localhost/pets; echo 

# 30 per second
curl -H "apikey: qmFm7B5zIKa99vcitRGX-p" localhost/pets/id01; echo 
curl -H "apikey: RCwyJs35QzVV6y1EmQFb-p" localhost/pets/id01; echo 
curl -H "apikey: H8Fv6UmGcj9y3Bb9TVF9-p" localhost/pets/id01; echo 

# 40 per minute
curl -X PUT -H "apikey: qmFm7B5zIKa99vcitRGX-p" localhost/pets/id01; echo 
curl -X PUT -H "apikey: RCwyJs35QzVV6y1EmQFb-p" localhost/pets/id01; echo 
curl -X PUT -H "apikey: H8Fv6UmGcj9y3Bb9TVF9-p" localhost/pets/id01; echo 

# 50 per second
curl -X DELETE -H "apikey: qmFm7B5zIKa99vcitRGX-p" localhost/pets/id01; echo 
curl -X DELETE -H "apikey: RCwyJs35QzVV6y1EmQFb-p" localhost/pets/id01; echo 
curl -X DELETE -H "apikey: H8Fv6UmGcj9y3Bb9TVF9-p" localhost/pets/id01; echo 