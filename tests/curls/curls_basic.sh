##### HEADER

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

#####################################################################

##### QUERY

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

#####################################################################

##### URL

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