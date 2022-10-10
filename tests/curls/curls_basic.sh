##### HEADER

# 1 per second
curl -H "apikey: 7B5zIqmRGXmrJTFmKa99-b" localhost/pets
curl -H "apikey: QzVV6y1EmQFbbxOfRCwy-b" localhost/pets
curl -H "apikey: mGcjH8Fv6U9y3BVF9H3Y-b" localhost/pets

# 2 per minute
curl -X POST -H "apikey: 7B5zIqmRGXmrJTFmKa99-b" localhost/pets
curl -X POST -H "apikey: QzVV6y1EmQFbbxOfRCwy-b" localhost/pets
curl -X POST -H "apikey: mGcjH8Fv6U9y3BVF9H3Y-b" localhost/pets

# 3 per second
curl -H "apikey: 7B5zIqmRGXmrJTFmKa99-b" localhost/pets/id01
curl -H "apikey: QzVV6y1EmQFbbxOfRCwy-b" localhost/pets/id01
curl -H "apikey: mGcjH8Fv6U9y3BVF9H3Y-b" localhost/pets/id01

# 4 per minute
curl -X PUT -H "apikey: 7B5zIqmRGXmrJTFmKa99-b" localhost/pets/id01
curl -X PUT -H "apikey: QzVV6y1EmQFbbxOfRCwy-b" localhost/pets/id01
curl -X PUT -H "apikey: mGcjH8Fv6U9y3BVF9H3Y-b" localhost/pets/id01

# 5 per second
curl -X DELETE -H "apikey: 7B5zIqmRGXmrJTFmKa99-b" localhost/pets/id01
curl -X DELETE -H "apikey: QzVV6y1EmQFbbxOfRCwy-b" localhost/pets/id01
curl -X DELETE -H "apikey: mGcjH8Fv6U9y3BVF9H3Y-b" localhost/pets/id01

#####################################################################

##### QUERY

# 1 per second
curl localhost/pets?apikey=7B5zIqmRGXmrJTFmKa99-b
curl localhost/pets?apikey=QzVV6y1EmQFbbxOfRCwy-b
curl localhost/pets?apikey=mGcjH8Fv6U9y3BVF9H3Y-b

# 2 per minute
curl -X POST localhost/pets?apikey=7B5zIqmRGXmrJTFmKa99-b
curl -X POST localhost/pets?apikey=QzVV6y1EmQFbbxOfRCwy-b
curl -X POST localhost/pets?apikey=mGcjH8Fv6U9y3BVF9H3Y-b

# 3 per second
curl localhost/pets/id01?apikey=7B5zIqmRGXmrJTFmKa99-b
curl localhost/pets/id01?apikey=QzVV6y1EmQFbbxOfRCwy-b
curl localhost/pets/id01?apikey=mGcjH8Fv6U9y3BVF9H3Y-b

# 4 per minute
curl -X PUT localhost/pets/id01?apikey=7B5zIqmRGXmrJTFmKa99-b
curl -X PUT localhost/pets/id01?apikey=QzVV6y1EmQFbbxOfRCwy-b
curl -X PUT localhost/pets/id01?apikey=mGcjH8Fv6U9y3BVF9H3Y-b

# 5 per second
curl -X DELETE localhost/pets/id01?apikey=7B5zIqmRGXmrJTFmKa99-b
curl -X DELETE localhost/pets/id01?apikey=QzVV6y1EmQFbbxOfRCwy-b
curl -X DELETE localhost/pets/id01?apikey=mGcjH8Fv6U9y3BVF9H3Y-b

#####################################################################

##### URL

# 1 per second
curl localhost/pets/7B5zIqmRGXmrJTFmKa99-b
curl localhost/pets/QzVV6y1EmQFbbxOfRCwy-b
curl localhost/pets/mGcjH8Fv6U9y3BVF9H3Y-b

# 2 per minute
curl -X POST localhost/pets/7B5zIqmRGXmrJTFmKa99-b
curl -X POST localhost/pets/QzVV6y1EmQFbbxOfRCwy-b
curl -X POST localhost/pets/mGcjH8Fv6U9y3BVF9H3Y-b

# 3 per second
curl localhost/pets/id01/7B5zIqmRGXmrJTFmKa99-b
curl localhost/pets/id01/QzVV6y1EmQFbbxOfRCwy-b
curl localhost/pets/id01/mGcjH8Fv6U9y3BVF9H3Y-b

# 4 per minute
curl -X PUT localhost/pets/id01/7B5zIqmRGXmrJTFmKa99-b
curl -X PUT localhost/pets/id01/QzVV6y1EmQFbbxOfRCwy-b
curl -X PUT localhost/pets/id01/mGcjH8Fv6U9y3BVF9H3Y-b

# 5 per second
curl -X DELETE localhost/pets/id01/7B5zIqmRGXmrJTFmKa99-b
curl -X DELETE localhost/pets/id01/QzVV6y1EmQFbbxOfRCwy-b
curl -X DELETE localhost/pets/id01/mGcjH8Fv6U9y3BVF9H3Y-b