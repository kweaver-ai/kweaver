#!/usr/bin/env bash
set -e
echo "nameserver 10.96.0.10" > /etc/resolv.conf
echo "nameserver XXX" >> /etc/resolv.conf
echo "search anyshare.svc.cluster.local svc.cluster.local cluster.local" >> /etc/resolv.conf
echo "options use-vc ndots:5 single-request-reopen" >> /etc/resolv.conf
cat /root/.hostgitconfig >> /root/.gitconfig
/bin/bash