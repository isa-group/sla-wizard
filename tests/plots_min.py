import matplotlib.pyplot as plt


files = ["/tmp/test_sleep0",
         "/tmp/test_sleep0.25",
         "/tmp/test_sleep0.5",
         "/tmp/test_sleep1"]

#files = ["/tmp/test_sleep10"]

plt.figure(figsize=(12,11))

count = 0
for file in files:
    values = open(file).readlines()
    values_proc = []
    for value in values:
        values_proc.append(int(value.replace("\n","")))
    
    counter = 221+count
    plt.subplot(counter)
    plt.suptitle("envoy", fontsize=25)
    plt.title(file.replace("../npm_test_bmks/%s/test_","").replace("p","p ") + "s")
    
    plt.plot(range(1,21), values_proc, "-o")
    
    plt.ylabel("Accepted requests")
    plt.xlabel("Iteration number")
    plt.yticks(range(0, 700, 50))
    plt.xticks(range(0, 21))

    count = count + 1 

plt.savefig('/tmp/plot.png')
