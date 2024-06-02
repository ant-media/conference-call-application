#!/bin/bash

# Lambda function names
shutdownLambdaFunction="yourShutdownLambdaFunctionName"
updateLoadBalancerLambdaFunction="yourUpdateLoadBalancerLambdaFunctionName"

# Threshold for idle CPU usage (%)
idleCpuThreshold=10

# Duration to check for idle status (in seconds)
idleDurationThreshold=$((60 * 60)) # 1 hour

# Flag to track idle status
isIdle=true

# Time when the script starts monitoring
startTime=$(date +%s)

# Main monitoring loop
while true; do
    # Placeholder for actual CPU usage check logic
    # This should be replaced with actual commands to retrieve CPU usage,
    # e.g., using top, sar, or another monitoring tool
    cpuUsage=0 # Placeholder value

    # Check if CPU usage is below the idle threshold
    if [ "$cpuUsage" -lt "$idleCpuThreshold" ]; then
        # Check if the system has been idle for longer than the threshold
        currentTime=$(date +%s)
        if [ $((currentTime - startTime)) -ge "$idleDurationThreshold" ]; then
            if [ "$isIdle" = true ]; then
                # System has been idle for more than the threshold, invoke the shutdown lambda
                aws lambda invoke --function-name "$shutdownLambdaFunction" --payload '{ "action": "shutdown" }' response.json
                echo "Shutdown Lambda function invoked."

                # Optionally, invoke Lambda to update Load Balancer
                aws lambda invoke --function-name "$updateLoadBalancerLambdaFunction" --payload '{ "action": "updateLoadBalancer" }' response.json
                echo "Load Balancer Update Lambda function invoked."

                # Exit the script or wait for further instructions
                exit 0
            fi
        else
            # Reset idle flag if the system becomes active
            isIdle=false
            startTime=$(date +%s)
        fi
    else
        # System is not idle, reset the start time and flag
        isIdle=false
        startTime=$(date +%s)
    fi

    # Wait for a minute before checking again
    sleep 60
done
