import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { getProducts } from '../../components/api/api';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import {
  Text,
  Card,
  DataTable,
  IconButton,
  ActivityIndicator,
  Surface,
} from 'react-native-paper';
import ProductRow from '../../components/myComp/ProductRow';

export default function AdminFillStock() {
  const router = useRouter();
  const { machineId } = useLocalSearchParams();

  const { data: products, isLoading, isError } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await getProducts(machineId);
      return res.data.data;
    },
    select: (data) => data.sort((a, b) => a.productNumber - b.productNumber),
  });

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading products...</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load products.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Surface style={styles.header} elevation={2}>
        <IconButton
          icon={() => <ArrowLeft size={24} />}
          onPress={() => router.push("/")}
        />
        <Text style={styles.title}>Admin - Fill Stock</Text>
      </Surface>

      <ScrollView style={styles.scrollView}>
        <Card style={styles.card}>
          <DataTable>
            <DataTable.Header style={styles.tableHeader}>
              <DataTable.Title>P.N.</DataTable.Title>
              <DataTable.Title>Name</DataTable.Title>
              <DataTable.Title>Stock</DataTable.Title>
              <DataTable.Title>Limit</DataTable.Title>
              <DataTable.Title>Action</DataTable.Title>
            </DataTable.Header>

            {products.map((product) => (
              <ProductRow key={product._id} product={product} />
            ))}
          </DataTable>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 16,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  card: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableHeader: {
    backgroundColor: '#f4f4f5',
    paddingVertical: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#ccc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 16,
  },
});
