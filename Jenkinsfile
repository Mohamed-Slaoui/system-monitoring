pipeline {
    agent any

    environment {
        FRONTEND_IMAGE = "system-monitor-frontend:${env.BUILD_ID}"
        BACKEND_IMAGE = "system-monitor-backend:${env.BUILD_ID}"
        FRONTEND_CONTAINER = "system-monitor-frontend"
        BACKEND_CONTAINER = "system-monitor-backend"
    }

    stages {
        stage('Build Frontend') {
            steps {
                dir('frontend') {
                    sh "docker build -t ${FRONTEND_IMAGE} ."
                }
            }
        }

        stage('Build Backend') {
            steps {
                dir('backend') {
                    sh "docker build -t ${BACKEND_IMAGE} ."
                }
            }
        }

        stage('Stop Old Containers') {
            steps {
                sh """
                # Stop and remove frontend if exists
                if [ \$(docker ps -a -q -f name=${FRONTEND_CONTAINER}) ]; then
                    docker stop ${FRONTEND_CONTAINER}
                    docker rm ${FRONTEND_CONTAINER}
                fi
                
                # Stop and remove backend if exists
                if [ \$(docker ps -a -q -f name=${BACKEND_CONTAINER}) ]; then
                    docker stop ${BACKEND_CONTAINER}
                    docker rm ${BACKEND_CONTAINER}
                fi
                """
            }
        }

        stage('Run Backend Container') {
            steps {
                sh """
                docker run -d \\
                  -p 3000:3000 \\
                  --name ${BACKEND_CONTAINER} \\
                  --restart unless-stopped \\
                  ${BACKEND_IMAGE}
                """
            }
        }

        stage('Run Frontend Container') {
            steps {
                sh """
                docker run -d \\
                  -p 3001:80 \\
                  --name ${FRONTEND_CONTAINER} \\
                  --restart unless-stopped \\
                  ${FRONTEND_IMAGE}
                """
            }
        }

        stage('Verify Deployment') {
            steps {
                sh """
                # Wait for containers to start
                sleep 10
                
                # Test backend
                echo "Testing backend..."
                curl -f http://localhost:3000/api/cpu || exit 1
                
                # Test frontend
                echo "Testing frontend..."
                curl -f http://localhost:3001 || exit 1
                
                echo "Deployment successful! ✅"
                """
            }
        }
    }

    post {
        always {
            echo "Pipeline execution completed"
            cleanWs()
        }
        success {
            echo "Build ${env.BUILD_ID} succeeded! 🎉"
            // You can add notifications here: slack, email, etc.
        }
        failure {
            echo "Build ${env.BUILD_ID} failed! ❌"
            // You can add failure notifications here
        }
    }
}