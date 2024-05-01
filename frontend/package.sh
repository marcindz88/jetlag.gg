docker login ghcr.io -u marcindz88 --password $1
docker build -t ghcr.io/marcindz88/jetlag/jetlag-frontend:latest .
docker push ghcr.io/marcindz88/jetlag/jetlag-frontend:latest
