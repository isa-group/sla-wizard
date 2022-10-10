#1 per second
curl -H "apikey: 7B5zIqmRGXmrJTFmKa99-b" localhost/first-endpoint
curl -H "apikey: QzVV6y1EmQFbbxOfRCwy-b" localhost/first-endpoint
curl -H "apikey: mGcjH8Fv6U9y3BVF9H3Y-b" localhost/first-endpoint

# 2 per minute
curl -H "apikey: 7B5zIqmRGXmrJTFmKa99-b" localhost/second-endpoint
curl -H "apikey: QzVV6y1EmQFbbxOfRCwy-b" localhost/second-endpoint
curl -H "apikey: mGcjH8Fv6U9y3BVF9H3Y-b" localhost/second-endpoint

---------------------------------------------------------------------

# 10 per second
curl -H "apikey: qmFm7B5zIKa99vcitRGX-p" localhost/first-endpoint
curl -H "apikey: RCwyJs35QzVV6y1EmQFb-p" localhost/first-endpoint
curl -H "apikey: H8Fv6UmGcj9y3Bb9TVF9-p" localhost/first-endpoint

# 20 per minute
curl -H "apikey: qmFm7B5zIKa99vcitRGX-p" localhost/second-endpoint
curl -H "apikey: RCwyJs35QzVV6y1EmQFb-p" localhost/second-endpoint
curl -H "apikey: H8Fv6UmGcj9y3Bb9TVF9-p" localhost/second-endpoint

#####################################################################

#1 per second
curl localhost/first-endpoint?apikey=7B5zIqmRGXmrJTFmKa99-b
curl localhost/first-endpoint?apikey=QzVV6y1EmQFbbxOfRCwy-b
curl localhost/first-endpoint?apikey=mGcjH8Fv6U9y3BVF9H3Y-b

# 2 per minute
curl localhost/second-endpoint?apikey=7B5zIqmRGXmrJTFmKa99-b
curl localhost/second-endpoint?apikey=QzVV6y1EmQFbbxOfRCwy-b
curl localhost/second-endpoint?apikey=mGcjH8Fv6U9y3BVF9H3Y-b

---------------------------------------------------------------------
# 10 per second
curl localhost/first-endpoint?apikey=H8Fv6UmGcj9y3Bb9TVF9-p
curl localhost/first-endpoint?apikey=qmFm7B5zIKa99vcitRGX-p
curl localhost/first-endpoint?apikey=RCwyJs35QzVV6y1EmQFb-p

# 20 per minute
curl localhost/second-endpoint?apikey=H8Fv6UmGcj9y3Bb9TVF9-p
curl localhost/second-endpoint?apikey=qmFm7B5zIKa99vcitRGX-p
curl localhost/second-endpoint?apikey=RCwyJs35QzVV6y1EmQFb-p

#####################################################################

#1 per second
curl localhost/first-endpoint/7B5zIqmRGXmrJTFmKa99-b
curl localhost/first-endpoint/QzVV6y1EmQFbbxOfRCwy-b
curl localhost/first-endpoint/mGcjH8Fv6U9y3BVF9H3Y-b

# 2 per minute
curl localhost/second-endpoint/7B5zIqmRGXmrJTFmKa99-b
curl localhost/second-endpoint/QzVV6y1EmQFbbxOfRCwy-b
curl localhost/second-endpoint/mGcjH8Fv6U9y3BVF9H3Y-b

# 10 per second
curl localhost/first-endpoint/qmFm7B5zIKa99vcitRGX-p
curl localhost/first-endpoint/RCwyJs35QzVV6y1EmQFb-p
curl localhost/first-endpoint/H8Fv6UmGcj9y3Bb9TVF9-p

# 20 per minute
curl localhost/second-endpoint/qmFm7B5zIKa99vcitRGX-p
curl localhost/second-endpoint/RCwyJs35QzVV6y1EmQFb-p
curl localhost/second-endpoint/H8Fv6UmGcj9y3Bb9TVF9-p