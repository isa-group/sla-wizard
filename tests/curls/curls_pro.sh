##### HEADER

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

#####################################################################

##### QUERY

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

#####################################################################

##### URL

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